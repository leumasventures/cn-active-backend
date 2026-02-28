import express from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, updateBalance, deleteSupplier } from '../controllers/supplier.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createSupplierSchema), createSupplier);
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), validate(updateSupplierSchema), updateSupplier);
router.patch('/:id/balance', restrictTo('ADMIN', 'MANAGER'), updateBalance);
router.delete('/:id', restrictTo('ADMIN'), deleteSupplier);

export default router;