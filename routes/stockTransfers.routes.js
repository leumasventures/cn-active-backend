import express from 'express';
import { getStockTransfers, getStockTransfer, createStockTransfer, deleteStockTransfer } from '../controllers/stockTransfer.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createStockTransferSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getStockTransfers);
router.get('/:id', getStockTransfer);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createStockTransferSchema), createStockTransfer);
router.delete('/:id', restrictTo('ADMIN'), deleteStockTransfer);

export default router;