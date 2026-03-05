// controllers/admin.controller.js — NEW FILE
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

/* ── List all users (with optional filter) ───────────────────── */
export const listUsers = async (req, res) => {
  try {
    const { approved, role } = req.query;

    const where = {};
    if (approved !== undefined) where.approved = approved === 'true';
    if (role)                   where.role = role.toUpperCase();

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true,
        role: true, active: true, approved: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── List pending accounts only ──────────────────────────────── */
export const listPending = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false },
      select: {
        id: true, name: true, email: true,
        role: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Approve account ─────────────────────────────────────────── */
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.approved) return res.status(400).json({ success: false, message: 'User is already approved' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { approved: true },
      select: { id: true, name: true, email: true, role: true, approved: true },
    });

    res.json({ success: true, message: `${updated.name}'s account has been approved`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Reject / delete account ─────────────────────────────────── */
export const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent deleting the only admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', approved: true } });
      if (adminCount <= 1)
        return res.status(400).json({ success: false, message: 'Cannot remove the only admin account' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'Account rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Toggle active/suspend ───────────────────────────────────── */
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent suspending yourself
    if (user.id === req.user.id)
      return res.status(400).json({ success: false, message: 'You cannot suspend your own account' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { active: !user.active },
      select: { id: true, name: true, email: true, active: true },
    });

    res.json({
      success: true,
      message: `${updated.name} has been ${updated.active ? 'activated' : 'suspended'}`,
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Update user role ────────────────────────────────────────── */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER'];
    if (!validRoles.includes(role?.toUpperCase()))
      return res.status(400).json({ success: false, message: 'Invalid role. Use ADMIN, MANAGER, or CASHIER' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { role: role.toUpperCase() },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ success: true, message: `Role updated to ${updated.role}`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};