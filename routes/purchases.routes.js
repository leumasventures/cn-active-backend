import express from 'express';
import { getPurchases, getPurchase, createPurchase, deletePurchase } from '../controllers/purchase.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createPurchaseSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getPurchases);
router.get('/:id', getPurchase);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createPurchaseSchema), createPurchase);
router.delete('/:id', restrictTo('ADMIN'), deletePurchase);

export default router;