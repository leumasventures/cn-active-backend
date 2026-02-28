import express from 'express';
import { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouse.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createWarehouseSchema), createWarehouse);
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), validate(updateWarehouseSchema), updateWarehouse);
router.delete('/:id', restrictTo('ADMIN'), deleteWarehouse);

export default router;