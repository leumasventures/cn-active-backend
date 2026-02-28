import express from 'express';
import { getSalesSummary, getPurchasesSummary, getExpensesSummary, getProfitLoss, getStockValuation } from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.get('/sales', getSalesSummary);
router.get('/purchases', getPurchasesSummary);
router.get('/expenses', getExpensesSummary);
router.get('/profit-loss', getProfitLoss);
router.get('/stock-valuation', getStockValuation);

export default router;