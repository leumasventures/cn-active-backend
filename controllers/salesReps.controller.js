// controllers/salesReps.controller.js
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

/* ── List all sales reps (CASHIER + MANAGER roles) ───────────── */
export const listSalesReps = async (req, res) => {
  try {
    const reps = await prisma.user.findMany({
      where:   { role: { in: ['CASHIER', 'MANAGER'] }, active: true },
      select:  {
        id: true, name: true, email: true, role: true,
        active: true, approved: true, createdAt: true,
        // appState stores commission + warehouseId as JSON
        appState: true,
      },
      orderBy: { name: 'asc' },
    });

    // Parse appState to expose commission / warehouseId
    const shaped = reps.map(r => {
      let extra = {};
      try { extra = JSON.parse(r.appState || '{}'); } catch {}
      return {
        id:          r.id,
        name:        r.name,
        email:       r.email,
        phone:       extra.phone       || '',
        role:        r.role,
        warehouseId: extra.warehouseId || null,
        commission:  extra.commission  ?? 2,
        totalSales:  extra.totalSales  ?? 0,
        active:      r.active,
        approved:    r.approved,
      };
    });

    res.json({ success: true, data: shaped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Create a sales rep (creates a User with CASHIER role) ───── */
export const createSalesRep = async (req, res) => {
  try {
    const { name, email, phone, warehouseId, commission, password } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, message: 'name and email are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already in use' });

    const hashed = await bcrypt.hash(password || 'changeme123', 12);

    const appState = JSON.stringify({
      phone:       phone       || '',
      warehouseId: warehouseId || null,
      commission:  commission  ?? 2,
      totalSales:  0,
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role:     'CASHIER',
        active:   true,
        approved: true,       // auto-approve reps created by manager/admin
        appState,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id:          user.id,
        name:        user.name,
        email:       user.email,
        phone:       phone       || '',
        warehouseId: warehouseId || null,
        commission:  commission  ?? 2,
        totalSales:  0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Update a sales rep ──────────────────────────────────────── */
export const updateSalesRep = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, warehouseId, commission, totalSales } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return res.status(404).json({ success: false, message: 'Sales rep not found' });

    // Merge appState
    let existing = {};
    try { existing = JSON.parse(user.appState || '{}'); } catch {}

    const appState = JSON.stringify({
      ...existing,
      phone:       phone       ?? existing.phone       ?? '',
      warehouseId: warehouseId ?? existing.warehouseId ?? null,
      commission:  commission  ?? existing.commission  ?? 2,
      totalSales:  totalSales  ?? existing.totalSales  ?? 0,
    });

    const updated = await prisma.user.update({
      where: { id },
      data:  {
        ...(name  && { name }),
        ...(email && { email }),
        appState,
      },
    });

    let extra = {};
    try { extra = JSON.parse(updated.appState || '{}'); } catch {}

    res.json({
      success: true,
      data: {
        id:          updated.id,
        name:        updated.name,
        email:       updated.email,
        phone:       extra.phone       || '',
        warehouseId: extra.warehouseId || null,
        commission:  extra.commission  ?? 2,
        totalSales:  extra.totalSales  ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Delete (deactivate) a sales rep ─────────────────────────── */
export const deleteSalesRep = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return res.status(404).json({ success: false, message: 'Sales rep not found' });

    // Soft-delete: deactivate rather than destroy
    await prisma.user.update({ where: { id }, data: { active: false } });

    res.json({ success: true, message: 'Sales rep deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};