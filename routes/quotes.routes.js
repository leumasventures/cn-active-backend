import express from 'express';
import { getQuotes, getQuote, createQuote, updateQuoteStatus, deleteQuote } from '../controllers/quote.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createQuoteSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getQuotes);
router.get('/:id', getQuote);
router.post('/', validate(createQuoteSchema), createQuote);
router.patch('/:id/status', updateQuoteStatus);
router.delete('/:id', restrictTo('ADMIN', 'MANAGER'), deleteQuote);

export default router;