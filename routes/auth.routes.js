import express from 'express';
import { login, refreshToken, logout } from '../controllers/auth.controller.js';
import { protect, getMe } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;