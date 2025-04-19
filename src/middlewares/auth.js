import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';


// Add this new middleware

export const protect = catchAsync(async (req, res, next) => {
    // 1) Get token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
  
    if (!token) {
      return next(new AppError('Not logged in!', 401));
    }
  
    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    // 3) Check user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('User no longer exists', 401));
    }
  
    // 4) Attach user to request
    req.user = currentUser; // <-- THIS LINE IS CRUCIAL
    next();
  });


export const restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
      next();
    };
  };
