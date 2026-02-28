import express from 'express';

import authRoutes from './auth.routes.js';
import settingsRoutes from './settings.routes.js';
import productRoutes from './products.routes.js';
import customerRoutes from './customers.routes.js';
import supplierRoutes from './suppliers.routes.js';
import warehouseRoutes from './warehouses.routes.js';
import saleRoutes from './sales.routes.js';
import purchaseRoutes from './purchases.routes.js';
import quoteRoutes from './quotes.routes.js';
import creditNoteRoutes from './creditNotes.routes.js';
import expenseRoutes from './expenses.routes.js';
import reportRoutes from './reports.routes.js';
import stockTransferRoutes from './stockTransfers.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/sales', saleRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/quotes', quoteRoutes);
router.use('/credit-notes', creditNoteRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/stock-transfers', stockTransferRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.use('/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router;