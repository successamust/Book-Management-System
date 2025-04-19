import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.js';
import { getUser, getAllUsers } from '../controllers/userController.js';

const router = express.Router();

// Protected routes (require login)
//router.use(protect);

// Admin-only routes
router.use(protect)
router.get('/:id', getUser); // Regular user can access their own profile

router.use(restrictTo('admin'));
router.get('/', getAllUsers); //Get all users



export default router;