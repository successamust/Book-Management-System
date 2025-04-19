import express from 'express';
import { createBook, getAllBooks, getBook } from '../controllers/bookController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();


router.use(protect)

router.get('/', getAllBooks);
router.get('/:id', getBook);

router.use(restrictTo('admin'));
router.post('/', createBook);


export default router;