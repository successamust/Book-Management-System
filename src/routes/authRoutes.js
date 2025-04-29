import express from 'express';
import { register, registerAdmin, login } from '../controllers/authController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();


router.post('/register', register);
router.post('/register-admin', protect, restrictTo('admin'), registerAdmin); // Admin-only
router.post('/login', login);
router.post('/forgot-password', forgotPassword); 
router.patch('/reset-password/:token', resetPassword); 


export default router;