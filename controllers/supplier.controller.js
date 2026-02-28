import prisma from '../config/db.js';

export const getSuppliers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] } : {};
    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), suppliers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getSupplier = async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id }, include: { purchases: { orderBy: { createdAt: 'desc' }, take: 10 } } });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, contactPerson, notes } = req.body;
    const supplier = await prisma.supplier.create({ data: { name, phone, email, address, contactPerson, notes } });
    res.status(201).json({ success: true, supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, contactPerson, notes } = req.body;
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: { name, phone, email, address, contactPerson, notes } });
    res.json({ success: true, supplier });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number') return res.status(400).json({ success: false, message: 'amount must be a number' });
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: { balance: { increment: amount } } });
    res.json({ success: true, supplier });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Supplier not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete supplier with existing purchases' });
    res.status(500).json({ success: false, message: err.message });
  }
};