import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.js';
import { getFines, payFine, calculateFines } from '../controllers/fineController.js';

const router = express.Router();

router.use(protect); // Protect all routes below

router.get('/', getFines);
router.post('/:id/pay', payFine);
router.get('/calculate', restrictTo('admin'), calculateFines); // Admin-only

export default router;