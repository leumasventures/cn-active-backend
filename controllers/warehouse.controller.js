import prisma from '../config/db.js';

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, warehouses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getWarehouse = async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, warehouse });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createWarehouse = async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const warehouse = await prisma.warehouse.create({ data: { name, location, description } });
    res.status(201).json({ success: true, warehouse });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: { name, location, description },
    });
    res.json({ success: true, warehouse });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Warehouse not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete warehouse with existing products or transfers' });
    res.status(500).json({ success: false, message: err.message });
  }
};