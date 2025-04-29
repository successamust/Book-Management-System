import express from 'express';
import { borrowBook, returnBook, getActiveBorrows, getBorrowHistory, getOverdueBooks } from '../controllers/borrowController.js';
import { restrictTo, protect, validateUserAccess  } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect)

router.post('/:bookId', restrictTo('user', 'admin'), borrowBook);
router.post('/return/:bookId', restrictTo('user', 'admin'), returnBook);
router.get('/active', restrictTo('user', 'admin'), validateUserAccess, getActiveBorrows);
router.get('/history', validateUserAccess, getBorrowHistory);
router.get('/overdue', restrictTo('admin'), getOverdueBooks);

export default router;


