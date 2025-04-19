import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';

// Register a new user
export const register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

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
        password
      })

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


//creating new admin user(only admin can create another admin)
export const registerAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // Force role to 'admin'
  const newAdmin = await User.create({
    name,
    email,
    password,
    role: 'admin' // Override any role sent in the request
  });

  // Remove password from response
  newAdmin.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      user: newAdmin
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


//when user forgot password

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user found', 404));

  // 2) Generate token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    // Clear token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending email. Try again later!', 500));
  }
});


//Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) Check token validity
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  // 3) Update password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log user in (send new JWT)
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