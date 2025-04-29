import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';

/**
 * @desc    Register a new user.
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new AppError('Please fill in all required fields.', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email address is already in use.', 400));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long.', 400));
    }

    const user = await User.create({
        name,
        email,
        password
    });

    // Prevent password from being sent in the response
    user.password = undefined;

    res.status(201).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Register a new admin user (only accessible by existing admins).
 * @route   POST /api/auth/register/admin
 * @access  Private (Admin only)
 */
export const registerAdmin = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email address is already in use.', 400));
    }

    const newAdmin = await User.create({
        name,
        email,
        password,
        role: 'admin' // Enforce 'admin' role
    });

    // Prevent password from being sent in the response
    newAdmin.password = undefined;

    res.status(201).json({
        status: 'success',
        data: {
            user: newAdmin
        }
    });
});

/**
 * @desc    Login an existing user.
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide both email and password.', 400));
    }

    // Select password for validation
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password.', 401));
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // Prevent password from being sent in the response
    user.password = undefined;

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
});

/**
 * @desc    Request password reset. Sends a reset token to the user's email.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address.', 404));
    }

    // Generate reset token and save hashed version to user
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please submit a PATCH request with your new password to: ${resetURL}\n\nIf you did not request this, please ignore this email.`;

        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Password reset token has been sent to your email address.'
        });
    } catch (err) {
        // Clear reset token fields on error
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Please try again later.', 500));
    }
});

/**
 * @desc    Reset user's password using the provided token.
 * @route   PATCH /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = catchAsync(async (req, res, next) => {
    // Hash the token received in the URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Password reset token is invalid or has expired.', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Helper function to generate JWT token
    const signToken = (id) => {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '30d',
        });
    };

    // Generate and send a new JWT
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