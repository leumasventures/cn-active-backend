import prisma from '../config/db.js';
import { getNextNumber } from '../utils/helpers.js';

export const getPurchases = async (req, res) => {
  try {
    const { search, supplierId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(supplierId && { supplierId }), ...(search && { OR: [{ purchaseNo: { contains: search } }, { supplier: { name: { contains: search } } }] }) };
    const [purchases, total] = await prisma.$transaction([
      prisma.purchase.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { supplier: true, warehouse: true, items: { include: { product: true } } } }),
      prisma.purchase.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), purchases });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPurchase = async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({ where: { id: req.params.id }, include: { supplier: true, warehouse: true, rep: { select: { id: true, name: true } }, items: { include: { product: true } } } });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, purchase });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, warehouseId, items, notes } = req.body;
    const total = items.reduce((sum, item) => sum + item.qty * item.costPrice, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      const s = await tx.settings.findUnique({ where: { id: 'global' } });
      const purchaseNo = getNextNumber(s.nextReceiptNo, s.receiptPrefix);
      await tx.settings.update({ where: { id: 'global' }, data: { nextReceiptNo: { increment: 1 } } });

      const newPurchase = await tx.purchase.create({
        data: { purchaseNo, supplierId: supplierId || null, warehouseId, repId: req.user.id, total, notes, items: { create: items.map((item) => ({ productId: item.productId, qty: item.qty, costPrice: item.costPrice, total: item.qty * item.costPrice })) } },
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.productStock.upsert({ where: { productId_warehouseId: { productId: item.productId, warehouseId } }, update: { quantity: { increment: item.qty } }, create: { productId: item.productId, warehouseId, quantity: item.qty } });
        await tx.product.update({ where: { id: item.productId }, data: { costPrice: item.costPrice } });
      }

      if (supplierId) {
        await tx.supplier.update({ where: { id: supplierId }, data: { totalPurchases: { increment: total }, balance: { increment: total } } });
      }

      return newPurchase;
    });

    res.status(201).json({ success: true, purchase });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deletePurchase = async (req, res) => {
  try {
    await prisma.purchase.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Purchase deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};