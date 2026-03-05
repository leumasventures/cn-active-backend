// auth.controller.js — full file, replace your existing one
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

// ── Login ─────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXP || '7d' }
    );
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Signup ────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Map frontend role values to Prisma enum (Role: ADMIN | MANAGER | CASHIER)
    const roleMap = {
      admin:    'ADMIN',
      manager:  'MANAGER',
      cashier:  'CASHIER',
      ADMIN:    'ADMIN',
      MANAGER:  'MANAGER',
      CASHIER:  'CASHIER',
    };
    const assignedRole = roleMap[role] || 'CASHIER';

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Build name
    const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role:     assignedRole,
        name,
        active:   true,
      },
    });

    // Issue tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXP || '7d' }
    );

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Refresh Token ─────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXP || '15m' }
    );
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXP || '7d' }
    );
    res.status(200).json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// ── Logout ────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out – delete tokens on client' });
};