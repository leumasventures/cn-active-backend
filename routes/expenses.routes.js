import express from 'express';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expense.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', validate(createExpenseSchema), createExpense);
router.put('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', restrictTo('ADMIN', 'MANAGER'), deleteExpense);

export default router;