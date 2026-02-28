import prisma from '../config/db.js';
import { getNextNumber } from '../utils/helpers.js';

export const getCreditNotes = async (req, res) => {
  try {
    const { search, customerId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(customerId && { customerId }), ...(search && { OR: [{ creditNoteNo: { contains: search } }, { customer: { name: { contains: search } } }] }) };
    const [creditNotes, total] = await prisma.$transaction([
      prisma.creditNote.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { customer: true, sale: true, items: { include: { product: true } } } }),
      prisma.creditNote.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), creditNotes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getCreditNote = async (req, res) => {
  try {
    const creditNote = await prisma.creditNote.findUnique({ where: { id: req.params.id }, include: { customer: true, sale: true, items: { include: { product: true } } } });
    if (!creditNote) return res.status(404).json({ success: false, message: 'Credit note not found' });
    res.json({ success: true, creditNote });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createCreditNote = async (req, res) => {
  try {
    const { saleId, items, reason } = req.body;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

    const creditNote = await prisma.$transaction(async (tx) => {
      const s = await tx.settings.findUnique({ where: { id: 'global' } });
      const creditNoteNo = getNextNumber(s.nextCreditNoteNo, s.creditNotePrefix);
      await tx.settings.update({ where: { id: 'global' }, data: { nextCreditNoteNo: { increment: 1 } } });

      const newCreditNote = await tx.creditNote.create({
        data: { creditNoteNo, saleId, customerId: sale.customerId || null, reason, total, items: { create: items.map((item) => ({ productId: item.productId, qty: item.qty, unitPrice: item.unitPrice, total: item.qty * item.unitPrice })) } },
        include: { customer: true, sale: true, items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.productStock.upsert({ where: { productId_warehouseId: { productId: item.productId, warehouseId: sale.warehouseId } }, update: { quantity: { increment: item.qty } }, create: { productId: item.productId, warehouseId: sale.warehouseId, quantity: item.qty } });
      }

      if (sale.customerId) {
        await tx.customer.update({ where: { id: sale.customerId }, data: { balance: { decrement: total }, totalPurchases: { decrement: total } } });
      }

      return newCreditNote;
    });

    res.status(201).json({ success: true, creditNote });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteCreditNote = async (req, res) => {
  try {
    await prisma.creditNote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Credit note deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Credit note not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};