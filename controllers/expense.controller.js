import prisma from '../config/db.js';

export const getExpenses = async (req, res) => {
  try {
    const { search, category, from, to, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(category && { category }),
      ...(search && { OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ]}),
      ...((from || to) && { date: {
        ...(from && { gte: new Date(from) }),
        ...(to  && { lte: new Date(to)  }),
      }}),
    };
    const [expenses, total, aggregate] = await prisma.$transaction([
      prisma.expense.findMany({ where, skip, take: Number(limit), orderBy: { date: 'desc' } }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    res.json({ success: true, total, totalAmount: aggregate._sum.amount || 0, page: Number(page), pages: Math.ceil(total / Number(limit)), expenses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExpense = async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createExpense = async (req, res) => {
  try {
    const { title, description, amount, category, date, note, notes } = req.body;
    const expenseNo = `EXP-${Date.now()}`;
    const expense = await prisma.expense.create({
      data: {
        expenseNo,
        title:       title || description || 'Expense',
        description: description || title || null,
        amount:      Number(amount),
        category:    category || null,
        note:        note    || null,
        notes:       notes   || null,
        date:        date ? new Date(date) : new Date(),
        repId:       req.user?.id || null,
      },
    });
    res.status(201).json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateExpense = async (req, res) => {
  try {
    const { title, description, amount, category, date, note, notes } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        title:       title || description || undefined,
        description: description || undefined,
        amount:      amount !== undefined ? Number(amount) : undefined,
        category:    category || null,
        note:        note  || null,
        notes:       notes || null,
        date:        date ? new Date(date) : undefined,
      },
    });
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