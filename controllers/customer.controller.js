import prisma from '../config/db.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, include: { sales: true } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, loyaltyPoints } = req.body;
    const customer = await prisma.customer.create({ data: { name, email, phone, address, loyaltyPoints } });
    res.status(201).json({ success: true, customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { name, email, phone, address } });
    res.json({ success: true, customer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { loyaltyPoints: { increment: points } } });
    res.json({ success: true, customer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { balance: { increment: amount } } });
    res.json({ success: true, customer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};