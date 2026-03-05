// routes/admin.routes.js
import express from 'express';
import {
  listUsers,
  listPending,
  approveUser,
  rejectUser,
  toggleUserActive,
  updateUserRole,
  updateUserPrivileges,
  getUser,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require valid token + ADMIN role
router.use(protect, restrictTo('ADMIN'));

router.get('/users',                         listUsers);            // GET    /api/admin/users
router.get('/users/pending',                 listPending);          // GET    /api/admin/users/pending
router.get('/users/:id',                     getUser);              // GET    /api/admin/users/:id
router.patch('/users/:id/approve',           approveUser);          // PATCH  /api/admin/users/:id/approve
router.patch('/users/:id/toggle-active',     toggleUserActive);     // PATCH  /api/admin/users/:id/toggle-active
router.patch('/users/:id/role',              updateUserRole);       // PATCH  /api/admin/users/:id/role
router.patch('/users/:id/privileges',        updateUserPrivileges); // PATCH  /api/admin/users/:id/privileges
router.delete('/users/:id',                  rejectUser);           // DELETE /api/admin/users/:id

export default router;