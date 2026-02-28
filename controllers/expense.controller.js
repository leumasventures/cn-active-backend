import prisma from '../config/db.js';

export const getExpenses = async (req, res) => {
  try {
    const { search, category, from, to, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(category && { category }), ...(search && { description: { contains: search } }), ...((from || to) && { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }) };
    const [expenses, total, aggregate] = await prisma.$transaction([
      prisma.expense.findMany({ where, skip, take: Number(limit), orderBy: { date: 'desc' }, include: { rep: { select: { id: true, name: true } } } }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    res.json({ success: true, total, totalAmount: aggregate._sum.amount || 0, page: Number(page), pages: Math.ceil(total / Number(limit)), expenses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExpense = async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id }, include: { rep: { select: { id: true, name: true } } } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;
    const expenseNo = `EXP-${Date.now()}`;
    const expense = await prisma.expense.create({ data: { expenseNo, description, amount, category, date: date ? new Date(date) : new Date(), repId: req.user.id, notes }, include: { rep: { select: { id: true, name: true } } } });
    res.status(201).json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateExpense = async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: { description, amount, category, date: date ? new Date(date) : undefined, notes }, include: { rep: { select: { id: true, name: true } } } });
    res.json({ success: true, expense });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Expense not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Expense not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};