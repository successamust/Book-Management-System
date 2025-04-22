import express from 'express';
import { borrowBook, returnBook, getActiveBorrows, getBorrowHistory, getOverdueBooks } from '../controllers/borrowController.js';
import { restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/borrow/:bookId (User-only)
router.post('/:bookId', restrictTo('user'), borrowBook);
router.post('/return/:bookId', restrictTo('user'), returnBook);
router.get('/active', restrictTo('user'), getActiveBorrows);
router.get('/history', restrictTo('user'), getBorrowHistory);
router.get('/overdue', restrictTo('admin'), getOverdueBooks);

export default router;


