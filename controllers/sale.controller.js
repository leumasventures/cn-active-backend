import prisma from '../config/db.js';
import { getNextNumber, getBulkDiscount, calcLineTotal, calcTax, round2 } from '../utils/helpers.js';

export const getSales = async (req, res) => {
  try {
    const { search, customerId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(customerId && { customerId }), ...(search && { OR: [{ saleNo: { contains: search } }, { customer: { name: { contains: search } } }] }) };
    const [sales, total] = await prisma.$transaction([
      prisma.sale.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { customer: true, warehouse: true, items: { include: { product: true } } } }),
      prisma.sale.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), sales });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getSale = async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { customer: true, warehouse: true, rep: { select: { id: true, name: true } }, items: { include: { product: true } }, creditNotes: true } });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const completeSale = async (req, res) => {
  try {
    const { customerId, warehouseId, paymentMethod, posCart, extraDiscPct = 0, redeemPts = 0, repId, notes } = req.body;

    const settings = await prisma.settings.findUnique({ where: { id: 'global' }, include: { bulkDiscountTiers: true } });
    const taxRate = settings?.taxRate ?? 7.5;

    // Validate stock
    for (const item of posCart) {
      const stock = await prisma.productStock.findUnique({ where: { productId_warehouseId: { productId: item.productId, warehouseId } } });
      if (!stock || stock.quantity < item.qty) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product?.name || item.productId}` });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = posCart.map((item) => {
      const bulkDiscountPct = getBulkDiscount(item.qty, settings);
      const effectiveDisc = Math.max(item.manualDiscountPct || 0, bulkDiscountPct);
      const lineTotal = calcLineTotal(item.unitPrice, item.qty, effectiveDisc);
      subtotal += lineTotal;
      return { productId: item.productId, qty: item.qty, unitPrice: item.unitPrice, discountPct: item.manualDiscountPct || 0, bulkDiscountPct, total: lineTotal };
    });

    const discountAmt = round2(subtotal * (extraDiscPct / 100));
    const afterDiscount = round2(subtotal - discountAmt);
    const taxAmt = calcTax(afterDiscount, taxRate);
    const pointsValue = redeemPts > 0 && customerId ? round2(redeemPts / (settings?.loyaltyRedemptionRate ?? 100)) : 0;
    const total = round2(Math.max(0, afterDiscount + taxAmt - pointsValue));
    const pointsEarned = Math.floor((total / 1000) * (settings?.loyaltyPointsRate ?? 1));

    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.settings.findUnique({ where: { id: 'global' } });
      const saleNo = getNextNumber(s.nextInvoiceNo, s.invoicePrefix);
      await tx.settings.update({ where: { id: 'global' }, data: { nextInvoiceNo: { increment: 1 } } });

      const newSale = await tx.sale.create({
        data: { saleNo, customerId: customerId || null, warehouseId, repId: repId || null, paymentMethod: paymentMethod.toUpperCase(), subtotal, discountPct: extraDiscPct, discountAmt, taxAmt, total, pointsRedeemed: redeemPts, pointsEarned, notes, items: { create: saleItems } },
        include: { customer: true, warehouse: true, items: { include: { product: true } } },
      });

      for (const item of posCart) {
        await tx.productStock.update({ where: { productId_warehouseId: { productId: item.productId, warehouseId } }, data: { quantity: { decrement: item.qty } } });
      }

      if (customerId) {
        await tx.customer.update({ where: { id: customerId }, data: { loyaltyPoints: { increment: pointsEarned - redeemPts }, totalPurchases: { increment: total }, ...(paymentMethod.toUpperCase() === 'CREDIT' && { balance: { increment: total } }) } });
      }

      return newSale;
    });

    res.status(201).json({ success: true, sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteSale = async (req, res) => {
  try {
    await prisma.sale.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Sale not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete sale with linked records' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const { items, subtotal, discount, tax, total, paymentMethod, customerId, notes } = req.body;

    if (!items?.length) return res.status(400).json({ success: false, message: 'No items provided' });

    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });

    const sale = await prisma.$transaction(async (tx) => {
      let receiptNo = `RCP-${Date.now()}`;
      if (settings) {
        const num = String(settings.nextInvoiceNo || 1).padStart(4, '0');
        receiptNo = `RCP-${num}`;
        await tx.settings.update({ where: { id: 'global' }, data: { nextInvoiceNo: { increment: 1 } } });
      }

      const newSale = await tx.sale.create({
        data: {
          receiptNo,
          customerId: customerId || null,
          paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
          subtotal: subtotal || 0,
          discount: discount || 0,
          tax: tax || 0,
          total: total || 0,
          note: notes || null,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              qty: i.qty,
              price: i.price,
              discount: 0,
              total: i.total,
            })),
          },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      // Deduct stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Update customer loyalty
      if (customerId) {
        const pointsEarned = Math.floor((total / 1000) * (settings?.loyaltyPointsRate ?? 1));
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned },
            totalPurchases: { increment: total },
          },
        });
      }

      return newSale;
    });

    res.status(201).json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};