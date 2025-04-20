import express from 'express';
import { protect, restrictTo } from '../middlewares/auth.js';
import { getUser, getAllUsers, updateUser, changePassword, deleteUser } from '../controllers/userController.js';

const router = express.Router();

// Protected routes (require login)
router.use(protect)

// Password change (authenticated users only)
router.patch('/change-password', changePassword);

 // Regular user can access/update their own profile
router.get('/:id', getUser); 
router.patch('/:id', updateUser);
router.delete('/:id', protect, deleteUser);

// Admin-only routes
router.use(restrictTo('admin'));
router.get('/', getAllUsers); //Get all users

// Regular user can update their own profile, admin can update any user




export default router;