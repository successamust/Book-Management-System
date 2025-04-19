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