// controllers/admin.controller.js
import prisma from '../config/db.js';

// ── Valid privilege keys (must match frontend PRIVILEGE_GROUPS) ──────────────
const VALID_PRIVILEGES = new Set([
  'pos.access', 'sales.create', 'sales.view', 'sales.void', 'discount.apply',
  'products.view', 'products.create', 'products.edit', 'products.delete', 'stock.adjust',
  'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
  'reports.view', 'reports.export', 'dashboard.view',
  'users.view', 'users.manage', 'settings.view', 'settings.edit',
]);

// ── Role default privileges ──────────────────────────────────────────────────
const ROLE_DEFAULTS = {
  ADMIN: () => Object.fromEntries([...VALID_PRIVILEGES].map(k => [k, true])),
  MANAGER: () => ({
    'pos.access': true,  'sales.create': true,  'sales.view': true,
    'sales.void': true,  'discount.apply': true,
    'products.view': true, 'products.create': true, 'products.edit': true,
    'products.delete': false, 'stock.adjust': true,
    'customers.view': true, 'customers.create': true, 'customers.edit': true,
    'customers.delete': false,
    'reports.view': true, 'reports.export': true, 'dashboard.view': true,
    'users.view': true, 'users.manage': false, 'settings.view': true, 'settings.edit': false,
  }),
  CASHIER: () => ({
    'pos.access': true,  'sales.create': true,  'sales.view': false,
    'sales.void': false, 'discount.apply': false,
    'products.view': true, 'products.create': false, 'products.edit': false,
    'products.delete': false, 'stock.adjust': false,
    'customers.view': true, 'customers.create': true, 'customers.edit': false,
    'customers.delete': false,
    'reports.view': false, 'reports.export': false, 'dashboard.view': false,
    'users.view': false, 'users.manage': false, 'settings.view': false, 'settings.edit': false,
  }),
};

// Helper — parse JSON privileges stored in DB, merge with role defaults
function resolvePrivileges(user) {
  const defaults = (ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.CASHIER)();
  let stored = {};
  if (user.privileges) {
    try {
      stored = typeof user.privileges === 'string'
        ? JSON.parse(user.privileges)
        : user.privileges;
    } catch (_) {}
  }
  // Stored values override defaults; unknown keys are dropped
  const merged = { ...defaults };
  for (const [k, v] of Object.entries(stored)) {
    if (VALID_PRIVILEGES.has(k)) merged[k] = Boolean(v);
  }
  return merged;
}

// Shared select fields
const USER_SELECT = {
  id: true, name: true, email: true,
  role: true, active: true, approved: true,
  privileges: true, createdAt: true,
};

/* ── List all users ─────────────────────────────────────────────────────────── */
export const listUsers = async (req, res) => {
  try {
    const { approved, role } = req.query;
    const where = {};
    if (approved !== undefined) where.approved = approved === 'true';
    if (role) where.role = role.toUpperCase();

    const users = await prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    // Resolve privileges for every user before sending
    const enriched = users.map(u => ({ ...u, privileges: resolvePrivileges(u) }));

    res.json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── List pending accounts ──────────────────────────────────────────────────── */
export const listPending = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false },
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    const enriched = users.map(u => ({ ...u, privileges: resolvePrivileges(u) }));
    res.json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Approve account ────────────────────────────────────────────────────────── */
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)          return res.status(404).json({ success: false, message: 'User not found' });
    if (user.approved)  return res.status(400).json({ success: false, message: 'User is already approved' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { approved: true },
      select: USER_SELECT,
    });

    res.json({
      success: true,
      message: `${updated.name}'s account has been approved`,
      user: { ...updated, privileges: resolvePrivileges(updated) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Reject / delete account ────────────────────────────────────────────────── */
export const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

/* ── Toggle active / suspend ────────────────────────────────────────────────── */
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id)
      return res.status(400).json({ success: false, message: 'You cannot suspend your own account' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { active: !user.active },
      select: USER_SELECT,
    });

    res.json({
      success: true,
      message: `${updated.name} has been ${updated.active ? 'activated' : 'suspended'}`,
      user: { ...updated, privileges: resolvePrivileges(updated) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Update user role ───────────────────────────────────────────────────────── */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'MANAGER', 'CASHIER'];
    if (!validRoles.includes(role?.toUpperCase()))
      return res.status(400).json({ success: false, message: 'Invalid role. Use ADMIN, MANAGER, or CASHIER' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // When role changes, clear stored privileges so role defaults apply fresh
    const updated = await prisma.user.update({
      where: { id },
      data:  { role: role.toUpperCase(), privileges: null },
      select: USER_SELECT,
    });

    res.json({
      success: true,
      message: `Role updated to ${updated.role}`,
      user: { ...updated, privileges: resolvePrivileges(updated) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Update user privileges ─────────────────────────────────────────────────── */
export const updateUserPrivileges = async (req, res) => {
  try {
    const { id } = req.params;
    const { privileges } = req.body;

    if (!privileges || typeof privileges !== 'object' || Array.isArray(privileges))
      return res.status(400).json({ success: false, message: '`privileges` must be a key-value object' });

    // Sanitise — only store known keys with boolean values
    const sanitised = {};
    for (const [key, val] of Object.entries(privileges)) {
      if (VALID_PRIVILEGES.has(key)) sanitised[key] = Boolean(val);
    }

    if (!Object.keys(sanitised).length)
      return res.status(400).json({ success: false, message: 'No valid privilege keys provided' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data:  { privileges: sanitised },
      select: USER_SELECT,
    });

    res.json({
      success: true,
      message: `Privileges updated for ${updated.name}`,
      user: { ...updated, privileges: resolvePrivileges(updated) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Get single user (with resolved privileges) ─────────────────────────────── */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: { ...user, privileges: resolvePrivileges(user) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};