// middleware/auth.js — replace your existing file
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

/* ── protect: verify JWT ─────────────────────────────────────── */
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer'))
      token = req.headers.authorization.split(' ')[1];

    if (!token)
      return res.status(401).json({ success: false, error: 'Not authorized — no token' });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, role }
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, error: 'Token has expired' });
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/* ── restrictTo: role-based guard ────────────────────────────── */
export const restrictTo = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role)
    return res.status(403).json({ success: false, error: 'No role found on token' });

  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
    });

  next();
};

/* ── getMe ───────────────────────────────────────────────────── */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, approved: true, active: true },
    });

    if (!user)
      return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};