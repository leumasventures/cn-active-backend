import prisma from '../config/db.js';
import { getNextNumber } from '../utils/helpers.js';

export const getQuotes = async (req, res) => {
  try {
    const { search, customerId, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(customerId && { customerId }), ...(status && { status }), ...(search && { OR: [{ quoteNo: { contains: search } }, { customer: { name: { contains: search } } }] }) };
    const [quotes, total] = await prisma.$transaction([
      prisma.quote.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { customer: true, items: { include: { product: true } } } }),
      prisma.quote.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), quotes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getQuote = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { customer: true, rep: { select: { id: true, name: true } }, items: { include: { product: true } } } });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.json({ success: true, quote });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createQuote = async (req, res) => {
  try {
    const { customerId, items, validUntil, notes } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice * (1 - (item.discountPct || 0) / 100), 0);

    const quote = await prisma.$transaction(async (tx) => {
      const s = await tx.settings.findUnique({ where: { id: 'global' } });
      const quoteNo = getNextNumber(s.nextQuoteNo, s.quotePrefix);
      await tx.settings.update({ where: { id: 'global' }, data: { nextQuoteNo: { increment: 1 } } });

      return tx.quote.create({
        data: { quoteNo, customerId: customerId || null, repId: req.user.id, subtotal, total: subtotal, validUntil: validUntil ? new Date(validUntil) : null, notes, items: { create: items.map((item) => ({ productId: item.productId, qty: item.qty, unitPrice: item.unitPrice, discountPct: item.discountPct || 0, total: item.qty * item.unitPrice * (1 - (item.discountPct || 0) / 100) })) } },
        include: { customer: true, items: { include: { product: true } } },
      });
    });

    res.status(201).json({ success: true, quote });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    const quote = await prisma.quote.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, quote });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Quote not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Quote deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Quote not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};