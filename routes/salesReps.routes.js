// routes/salesReps.routes.js
import express from 'express';
import {
  listSalesReps,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
} from '../controllers/salesReps.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require a valid token
// Create/update/delete restricted to ADMIN and MANAGER
router.get(  '/',    protect, listSalesReps);
router.post( '/',    protect, restrictTo('ADMIN', 'MANAGER'), createSalesRep);
router.put(  '/:id', protect, restrictTo('ADMIN', 'MANAGER'), updateSalesRep);
router.delete('/:id',protect, restrictTo('ADMIN', 'MANAGER'), deleteSalesRep);

export default router;