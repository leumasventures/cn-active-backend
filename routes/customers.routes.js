import express from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, updateLoyaltyPoints, updateBalance, deleteCustomer } from '../controllers/customer.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', validate(createCustomerSchema), createCustomer);
router.put('/:id', validate(updateCustomerSchema), updateCustomer);
router.patch('/:id/loyalty', updateLoyaltyPoints);
router.patch('/:id/balance', updateBalance);
router.delete('/:id', restrictTo('ADMIN'), deleteCustomer);

export default router;