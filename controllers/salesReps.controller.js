// controllers/salesReps.controller.js
import prisma from '../config/db.js';

/* ── List all active sales reps ──────────────────────────────── */
export const listSalesReps = async (req, res) => {
  try {
    const reps = await prisma.salesRep.findMany({
      where:   { active: true },
      include: { warehouse: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: reps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Create a sales rep ──────────────────────────────────────── */
export const createSalesRep = async (req, res) => {
  try {
    const { name, email, phone, warehouseId, commission } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const rep = await prisma.salesRep.create({
      data: {
        name,
        email:       email       || null,
        phone:       phone       || null,
        warehouseId: warehouseId || null,
        commission:  parseFloat(commission) || 2,
      },
      include: { warehouse: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: rep });
  } catch (err) {
    if (err.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Email already in use' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Update a sales rep ──────────────────────────────────────── */
export const updateSalesRep = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, warehouseId, commission, totalSales } = req.body;

    const rep = await prisma.salesRep.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(email       !== undefined && { email: email || null }),
        ...(phone       !== undefined && { phone: phone || null }),
        ...(warehouseId !== undefined && { warehouseId: warehouseId || null }),
        ...(commission  !== undefined && { commission: parseFloat(commission) }),
        ...(totalSales  !== undefined && { totalSales: parseFloat(totalSales) }),
      },
      include: { warehouse: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: rep });
  } catch (err) {
    if (err.code === 'P2025')
      return res.status(404).json({ success: false, message: 'Sales rep not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Delete (soft) a sales rep ───────────────────────────────── */
export const deleteSalesRep = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.salesRep.update({ where: { id }, data: { active: false } });
    res.json({ success: true, message: 'Sales rep deleted' });
  } catch (err) {
    if (err.code === 'P2025')
      return res.status(404).json({ success: false, message: 'Sales rep not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};