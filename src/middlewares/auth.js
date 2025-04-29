import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

/**
 * @desc    Middleware to protect routes by verifying the JWT token
 * in the Authorization header. Attaches the authenticated user object
 * to the request (`req.user`).
 * @route   (No route, middleware)
 * @access  Private (Used to protect other routes)
 */
export const protect = catchAsync(async (req, res, next) => {
    // 1) Get the JWT token from the Authorization header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if a token exists
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to gain access.', 401));
    }

    // 2) Verify the JWT token's validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if the user associated with the token still exists in the database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Attach the authenticated user object to the request for subsequent middleware/controllers
    req.user = currentUser;
    next();
});

/**
 * @desc    Middleware to restrict access to specific user roles.
 * Returns a middleware function that checks if the authenticated user's
 * role is included in the allowed roles.
 * @route   (No route, middleware factory)
 * @access  Private (Used after the `protect` middleware)
 * @param   {...string} roles - An array of allowed user roles (e.g., 'admin', 'user').
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if the authenticated user's role is present in the allowed roles array
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action.', 403)
            );
        }
        next();
    };
};

export const validateUserAccess = (req, res, next) => {
  // Block non-admins from trying to access other users' data
  if (req.query.userId && req.user.role !== 'admin') {
    return next(new AppError('You can only view your own history', 403));
  }
  next();
};