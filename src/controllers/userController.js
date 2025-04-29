import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import BorrowRecord from '../models/BorrowRecord.js';

/**
 * @desc    Get a specific user's profile. Admins can access any profile,
 * while regular users can only access their own.
 * @route   GET /api/users/:id
 * @access  Private (Authenticated users, Admin)
 */
export const getUser = catchAsync(async (req, res, next) => {
    let query = User.findById(req.params.id);

    // Exclude sensitive data from the query
    query = query.select('-password -__v');

    const user = await query;

    if (!user) {
        return next(new AppError('No user found with that ID.', 404));
    }

    // Prevent regular users from accessing other user profiles
    if (req.user.role !== 'admin' && user._id.toString() !== req.user.id) {
        return next(new AppError('You are not authorized to access this user profile.', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Get a list of all user profiles.
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find().select('-password -__v'); // Exclude sensitive fields

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

/**
 * @desc    Update an existing user's profile. Admins can update any user
 * (including roles), while regular users can only update their own
 * information (excluding roles).
 * @route   PATCH /api/users/:id
 * @access  Private (Authenticated users, Admin)
 */
export const updateUser = catchAsync(async (req, res, next) => {
    const { name, email, role } = req.body;
    const userIdToUpdate = req.params.id; // User ID from the URL
    const currentUser = req.user; // Logged-in user details

    // 1) Check if the user to be updated exists
    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) {
        return next(new AppError('No user found with that ID.', 404));
    }

    // 2) Authorization checks:
    //    - Admins can update any user, including their role.
    //    - Regular users can only update their own profile and cannot change their role.
    if (
        currentUser.role !== 'admin' &&
        userIdToUpdate !== currentUser._id.toString()
    ) {
        return next(new AppError('You are only authorized to update your own profile.', 403));
    }

    // 3) Prevent non-admin users from changing roles
    if (role && currentUser.role !== 'admin') {
        return next(new AppError('Only administrators are authorized to change user roles.', 403));
    }

    // 4) Update the user's information
    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
    if (role && currentUser.role === 'admin') {
        userToUpdate.role = role;
    }

    // 5) Check if the provided email is already in use by another user
    if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userIdToUpdate) {
            return next(new AppError('This email address is already in use by another user.', 400));
        }
    }

    await userToUpdate.save();

    // 6) Remove sensitive data from the response
    userToUpdate.password = undefined;

    res.status(200).json({
        status: 'success',
        data: {
            user: userToUpdate
        }
    });
});

/**
 * @desc    Update the authenticated user's password.
 * @route   PATCH /api/users/me/update-password
 * @access  Private (Authenticated users)
 */
export const changePassword = catchAsync(async (req, res, next) => {
  // 1. Validate required fields exist
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  if (!newPassword || !confirmPassword) {
      return next(new AppError('Both new password and confirmation are required', 400));
  }

  // 2. Get user with password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
      return next(new AppError('User not found', 404));
  }

  // 3. Verify current password
  if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Current password is incorrect', 401));
  }

  // 4. Normalize and compare passwords safely
  const normNew = String(newPassword).normalize('NFKC').trim();
  const normConfirm = String(confirmPassword).normalize('NFKC').trim();

  if (normNew !== normConfirm) {
      console.log('Password mismatch:', {
          new: newPassword,
          confirm: confirmPassword,
          normalizedNew: normNew, 
          normalizedConfirm: normConfirm
      });
      return next(new AppError('New password and confirmation do not match', 400));
  }

  // 5. Validate length
  if (normNew.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
  }

  // 6. Update password
  await user.setPassword(req.body.newPassword);

   // Helper function to generate a new JWT token
  const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

// Generate and send a new JWT token upon successful password change
  const token = signToken(user._id);

  res.status(200).json({
      status: 'success',
      token,
      data: {
          id: user._id,
          name: user.name,
          email: user.email
      }
  });
});

/**
 * @desc    Delete a user account. Admins can delete any user, while regular
 * users can only delete their own account (soft delete by default).
 * @route   DELETE /api/users/:id
 * @access  Private (Authenticated users, Admin)
 */
export const deleteUser = catchAsync(async (req, res, next) => {
    const userIdToDelete = req.params.id;
    const currentUser = req.user; // Logged-in user details

    // 1) Prevent deletion of users with active book borrowings
    const activeBorrowings = await BorrowRecord.exists({
        user: userIdToDelete,
        status: 'borrowed' // Assuming 'borrowed' is the active status
    });

    if (activeBorrowings) {
        return next(new AppError('This user has active book borrowings and cannot be deleted.', 400));
    }

    // 2) Authorization checks:
    //    - Admins can delete any user.
    //    - Regular users can only delete their own account.
    if (
        currentUser.role !== 'admin' &&
        userIdToDelete !== currentUser._id.toString()
    ) {
        return next(new AppError('You are only authorized to delete your own account.', 403));
    }

    let user;
    // 3) Perform soft delete by default (set active to false)
    if (req.query.hardDelete !== 'true' || currentUser.role !== 'admin') {
        user = await User.findByIdAndUpdate(
            userIdToDelete,
            { active: false },
            { new: true }
        );
    }
    // 4) Perform hard delete if requested by an admin
    else if (req.query.hardDelete === 'true' && currentUser.role === 'admin') {
        user = await User.findByIdAndDelete(userIdToDelete);
    }

    if (!user) {
        return next(new AppError('No user found with that ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null // 204 No Content responses typically have no body
    });
});