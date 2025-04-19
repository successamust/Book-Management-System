import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

// Register a new user
export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return next(new AppError('Please fill in all fields', 400));
    } 

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email already in use', 400));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters', 400));
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user' // Default to 'user' if not provided
  });

    // Remove password from response
    user.password = undefined;

    // Send success response
    res.status(201).json({
      // token,
      status: 'success',
      data: {
      user
    }
  });
});

//login existing user
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  // 4) Remove password from output
  user.password = undefined;

  // 5) Send token to client
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});