import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, updateStock, getLowStock, deleteProduct } from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getProducts);
router.get('/low-stock', getLowStock);
router.get('/:id', getProduct);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createProductSchema), createProduct);
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), validate(updateProductSchema), updateProduct);
router.patch('/:id/stock', restrictTo('ADMIN', 'MANAGER'), updateStock);
router.delete('/:id', restrictTo('ADMIN'), deleteProduct);

export default router;