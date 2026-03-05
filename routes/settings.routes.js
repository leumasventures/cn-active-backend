import express from 'express';
import { getSettings, updateSettings, toggleBulkDiscount, updateBulkDiscountTier, deleteBulkDiscountTier, resetNumberCounters } from '../controllers/settings.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { updateSettingsSchema, bulkDiscountTierSchema, toggleBulkDiscountSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);

// GET is allowed for all authenticated roles (including CASHIER)
router.get('/', getSettings);

// Everything else is ADMIN/MANAGER only
router.use(restrictTo('ADMIN', 'MANAGER'));
router.patch('/', validate(updateSettingsSchema), updateSettings);
router.patch('/bulk-discount/toggle', validate(toggleBulkDiscountSchema), toggleBulkDiscount);
router.put('/bulk-discount/tiers/:tierId', validate(bulkDiscountTierSchema), updateBulkDiscountTier);
router.delete('/bulk-discount/tiers/:tierId', deleteBulkDiscountTier);
router.post('/reset-counters', restrictTo('ADMIN'), resetNumberCounters);

export default router;