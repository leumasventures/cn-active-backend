// controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

/* ── Helpers ─────────────────────────────────────────────────── */
const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXP || '15m' });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXP || '7d' });

/* ── Login ───────────────────────────────────────────────────── */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.active)
      return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.' });

    if (!user.approved)
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.',
        code: 'PENDING_APPROVAL',
      });

    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err.message, err.stack); // ← logs real error to Render
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Signup ──────────────────────────────────────────────────── */
export const signup = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const roleMap = { admin: 'ADMIN', manager: 'MANAGER', cashier: 'CASHIER' };
    const assignedRole = roleMap[role?.toLowerCase()] || 'CASHIER';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role:     assignedRole,
        name,
        active:   true,
        approved: false,
      },
    });

    res.status(201).json({
      success: true,
      pending: true,
      message: 'Account created! You will be able to log in once an admin approves your account.',
    });

  } catch (err) {
    console.error('SIGNUP ERROR:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Refresh Token ───────────────────────────────────────────── */
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ success: false, message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user)          return res.status(401).json({ success: false, message: 'User no longer exists' });
    if (!user.approved) return res.status(403).json({ success: false, message: 'Account pending approval', code: 'PENDING_APPROVAL' });

    res.status(200).json({
      success:      true,
      accessToken:  signAccess({ id: user.id, role: user.role }),
      refreshToken: signRefresh({ id: user.id }),
    });

  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

/* ── Logout ──────────────────────────────────────────────────── */
export const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out – clear tokens on client' });
};