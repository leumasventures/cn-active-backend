// routes/state.routes.js
import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* ── GET /api/state ── Load this user's saved app state ── */
router.get('/', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { appState: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const state = user.appState ? JSON.parse(user.appState) : null;
    res.json({ success: true, state });

  } catch (err) {
    console.error('GET /state error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/state ── Save this user's app state ── */
router.put('/', protect, async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) return res.status(400).json({ success: false, message: 'No state provided' });

    if (typeof state !== 'object' || Array.isArray(state)) {
      return res.status(400).json({ success: false, message: 'Invalid state format' });
    }

    // ── FIX: use upsert so it never fails if the user row is missing ──
    await prisma.user.upsert({
      where:  { id: req.user.id },
      update: { appState: JSON.stringify(state) },
      create: {
        id:       req.user.id,
        name:     req.user.name  || 'Unknown',
        email:    req.user.email || `${req.user.id}@placeholder.com`,
        password: 'PLACEHOLDER', // won't be used — real signup sets this
        appState: JSON.stringify(state),
      },
    });

    res.json({ success: true });

  } catch (err) {
    console.error('PUT /state error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;