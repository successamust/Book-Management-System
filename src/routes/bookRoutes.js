import express from 'express';
import { createBook, getAllBooks, getBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();


router.use(protect)

router.get('/', getAllBooks);
router.get('/:id', getBook);
router.post('/', restrictTo('admin'), createBook);
router.patch('/:id', restrictTo('admin'), updateBook);
router.delete('/:id', restrictTo('admin'), deleteBook);


export default router;