// routes/admin.routes.js — NEW FILE
import express from 'express';
import {
  listUsers,
  listPending,
  approveUser,
  rejectUser,
  toggleUserActive,
  updateUserRole,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require valid token + ADMIN role
router.use(protect, restrictTo('ADMIN'));

router.get('/users',            listUsers);         // GET  /api/admin/users?approved=false&role=CASHIER
router.get('/users/pending',    listPending);       // GET  /api/admin/users/pending
router.patch('/users/:id/approve', approveUser);   // PATCH /api/admin/users/:id/approve
router.delete('/users/:id',     rejectUser);        // DELETE /api/admin/users/:id
router.patch('/users/:id/toggle-active', toggleUserActive); // PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/role', updateUserRole);   // PATCH /api/admin/users/:id/role

export default router;