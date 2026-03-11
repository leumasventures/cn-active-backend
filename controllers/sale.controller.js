import prisma from '../config/db.js';

/* ── helpers ── */
const round2 = (n) => Math.round(n * 100) / 100;

const getReceiptNo = async (tx) => {
  const settings = await tx.settings.findUnique({ where: { id: 'global' } });
  const num      = String(settings?.nextReceiptNo ?? 5001).padStart(4, '0');
  const prefix   = settings?.receiptPrefix ?? 'RCP';
  await tx.settings.update({
    where: { id: 'global' },
    data:  { nextReceiptNo: { increment: 1 } },
  });
  return `${prefix}-${num}`;
};

/* ════════════════════════════════════════════════════════
   GET /api/sales  — list all sales
   ════════════════════════════════════════════════════════ */
export const getSales = async (req, res) => {
  try {
    const { search, customerId, page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = {
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { receiptNo:  { contains: search } },
          { customer:   { name: { contains: search } } },
        ],
      }),
    };

    const [sales, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        skip,
        take:     Number(limit),
        orderBy:  { createdAt: 'desc' },
        include:  { customer: true, items: { include: { product: true } } },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   GET /api/sales/:id  — single sale
   ════════════════════════════════════════════════════════ */
export const getSale = async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where:   { id: req.params.id },
      include: { customer: true, items: { include: { product: true } }, creditNotes: true },
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   POST /api/sales  — create a sale (POS checkout)
   ════════════════════════════════════════════════════════ */
export const createSale = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount      = 0,
      tax           = 0,
      total,
      paymentMethod = 'CASH',
      customerId,
      pointsRedeemed = 0,
      note,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Validate all products exist before starting transaction
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
    }

    const sale = await prisma.$transaction(async (tx) => {
      const settings    = await tx.settings.findUnique({ where: { id: 'global' } });
      const receiptNo   = await getReceiptNo(tx);
      const pointsRate  = settings?.loyaltyPointsRate  ?? 1;
      const pointsEarned = Math.floor((Number(total) / 1000) * Number(pointsRate));

      // Create sale + items
      const newSale = await tx.sale.create({
        data: {
          receiptNo,
          customerId:     customerId || null,
          paymentMethod:  paymentMethod.toUpperCase(),
          subtotal:       round2(Number(subtotal)),
          discount:       round2(Number(discount)),
          tax:            round2(Number(tax)),
          total:          round2(Number(total)),
          pointsEarned,
          pointsRedeemed: Number(pointsRedeemed),
          note:           note || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              qty:       Number(i.qty),
              price:     round2(Number(i.price)),
              discount:  round2(Number(i.discount ?? 0)),
              total:     round2(Number(i.total)),
            })),
          },
        },
        include: { customer: true, items: { include: { product: true } } },
      });

      // Deduct stock from each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { decrement: Number(item.qty) } },
        });
      }

      // Update customer loyalty points
      if (customerId) {
        const netPoints = pointsEarned - Number(pointsRedeemed);
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: netPoints },
            ...(paymentMethod.toUpperCase() === 'CREDIT' && {
              balance: { increment: round2(Number(total)) },
            }),
          },
        });
      }

      return newSale;
    });

    res.status(201).json({ success: true, sale });
  } catch (err) {
    console.error('POST /sales error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   DELETE /api/sales/:id  — void/delete a sale (ADMIN only)
   ════════════════════════════════════════════════════════ */
export const deleteSale = async (req, res) => {
  try {
    // Restore stock before deleting
    const sale = await prisma.sale.findUnique({
      where:   { id: req.params.id },
      include: { items: true },
    });

    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { increment: item.qty } },
        });
      }
      // Delete the sale (cascade deletes SaleItems)
      await tx.sale.delete({ where: { id: req.params.id } });
    });

    res.json({ success: true, message: 'Sale deleted and stock restored' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Sale not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete sale with linked records' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ════════════════════════════════════════════════════════
   Keep completeSale as alias for createSale (backwards compat)
   ════════════════════════════════════════════════════════ */
export const completeSale = createSale;