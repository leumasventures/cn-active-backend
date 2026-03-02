// middleware/auth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js'; // adjust path to your prisma client

/**
 * Protect routes - verifies JWT and attaches user to req
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Get token and check if it exists
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // You could also support token in cookie if you want:
    // else if (req.cookies?.token) {
    //   token = req.cookies.token;
    // }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token provided',
      });
    }

    // 2. Verify token
   const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3. Attach decoded payload to request
    req.user = decoded; // typically contains { id, role, email, ... }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // fallback for other unexpected errors
    return res.status(401).json({
      success: false,
      error: 'Not authorized',
    });
  }
};

/**
 * Restrict route to specific roles
 * Usage: restrictTo('admin', 'moderator')
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized - user role missing',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

/**
 * Get current authenticated user (basic profile)
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Add more safe fields if needed: createdAt, avatar, etc.
        // Avoid: password, sensitive tokens, etc.
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};