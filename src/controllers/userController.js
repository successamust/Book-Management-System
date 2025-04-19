import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';


// gettin user profile Private/Admin 
export const getUser = catchAsync(async (req, res, next) => {
  let query = User.findById(req.params.id);
  
  // Exclude sensitive data
  query = query.select('-password -__v');

  const user = await query;

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Check if regular user is trying to access another user's profile
  if (req.user.role !== 'admin' && user._id.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this user', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

//getting all users profile
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


// Update user (admin can update any user, regular users can only update themselves)
export const updateUser = catchAsync(async (req, res, next) => {
    const { name, email, role } = req.body;
    const userIdToUpdate = req.params.id; // ID from URL
    const currentUser = req.user; // Logged-in user (from protect middleware)
  
    // 1) Check if user exists
    const userToUpdate = await User.findById(userIdToUpdate);
    if (!userToUpdate) {
      return next(new AppError('No user found with that ID', 404));
    }
  
    // 2) Authorization check:
    // - Admins can update anyone (including roles)
    // - Regular users can only update THEIR OWN profile (and can't change role)
    if (
      currentUser.role !== 'admin' &&
      userIdToUpdate !== currentUser._id.toString()
    ) {
      return next(new AppError('You can only update your own profile!', 403));
    }
  
    // 3) Block non-admins from changing roles
    if (role && currentUser.role !== 'admin') {
      return next(new AppError('Only admins can change user roles!', 403));
    }
  
    // 4) Update the user
    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
    if (role && currentUser.role === 'admin') {
      userToUpdate.role = role;
    }
    //checking if email already exist
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userIdToUpdate) {
        return next(new AppError('Email already in use', 400));
      }
    }
  
    await userToUpdate.save();
  
    // 5) Remove sensitive data from response
    userToUpdate.password = undefined;
  
    res.status(200).json({
      status: 'success',
      data: {
        user: userToUpdate
      }
    });
  });


//change/update password
export const changePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
  
    // 2) Check if current password is correct
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Your current password is incorrect', 401));
    }
  
    // 3) Validate new password
    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }
  
    if (newPassword.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }
  
    // 4) Update password
    user.password = newPassword;
    await user.save(); // Triggers password hashing pre-save hook
  
    // 5) Log user in with new password (send new token)
    const token = signToken(user._id);
  
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  });