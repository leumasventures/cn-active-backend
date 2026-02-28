import express from 'express';
import { getSales, getSale, completeSale, deleteSale } from '../controllers/sale.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { completeSaleSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', validate(completeSaleSchema), completeSale);
router.delete('/:id', restrictTo('ADMIN'), deleteSale);

export default router;