import express from 'express';
import { getCreditNotes, getCreditNote, createCreditNote, deleteCreditNote } from '../controllers/creditNote.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createCreditNoteSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', getCreditNotes);
router.get('/:id', getCreditNote);
router.post('/', restrictTo('ADMIN', 'MANAGER'), validate(createCreditNoteSchema), createCreditNote);
router.delete('/:id', restrictTo('ADMIN'), deleteCreditNote);

export default router;