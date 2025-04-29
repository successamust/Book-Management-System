import BorrowRecord from '../models/BorrowRecord.js';
import Book from '../models/Book.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Borrow a book for the authenticated user.
 * @route   POST /api/borrow/:bookId
 * @access  Private (Authenticated users)
 */
export const borrowBook = catchAsync(async (req, res, next) => {
    const { bookId } = req.params;
    const userId = req.user.id; // Extracted from authenticated user

    // 1) Check if the book exists and is currently available
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0 || book.status !== 'available') {
        return next(new AppError('Book is not available for borrowing.', 400));
    }

    // 2) Prevent a user from having multiple active borrows of the same book
    const existingBorrow = await BorrowRecord.findOne({
        book: bookId,
        user: userId,
        status: 'borrowed'
    });
    if (existingBorrow) {
        return next(new AppError('You have already borrowed this book.', 400));
    }

    // 3) Create a new borrow record
    const borrowRecord = await BorrowRecord.create({
        book: bookId,
        user: userId,
        borrowDate: Date.now(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Set due date to 14 days from now
        status: 'borrowed'
    });

    // 4) Update the book's availability status and count
    book.available -= 1;
    book.status = book.available === 0 ? 'borrowed' : 'available';
    await book.save();

    res.status(201).json({
        status: 'success',
        data: {
            borrowRecord
        }
    });
});

/**
 * @desc    Return a borrowed book for the authenticated user.
 * @route   PATCH /api/return/:bookId
 * @access  Private (Authenticated users)
 */
export const returnBook = catchAsync(async (req, res, next) => {
    const { bookId } = req.params;
    const userId = req.user.id;

    // 1) Find the active borrow record for the book and user
    const borrowRecord = await BorrowRecord.findOne({
        book: bookId,
        user: userId,
        status: 'borrowed'
    });
    if (!borrowRecord) {
        return next(new AppError('No active borrow record found for this book.', 404));
    }

    // 2) Update the borrow record with return details
    borrowRecord.returnDate = Date.now();
    borrowRecord.status = 'returned';

    // 3) Calculate fines for late returns
    const daysLate = Math.max(0, Math.floor((borrowRecord.returnDate - borrowRecord.dueDate) / (1000 * 60 * 60 * 24)));
    borrowRecord.fineAmount = daysLate > 0 ? daysLate * 10 : 0; // $10 fine per day late

    await borrowRecord.save();

    // 4) Update the book's availability status and count
    const book = await Book.findById(bookId);
    book.available += 1;
    book.status = 'available'; // Once returned, it's available again
    await book.save();

    res.status(200).json({
        status: 'success',
        data: {
            borrowRecord
        }
    });
});

/**
 * @desc    Get a list of all currently borrowed books for the authenticated user.
 * @route   GET /api/borrows/active
 * @access  Private (Authenticated users)
 */
export const getActiveBorrows = catchAsync(async (req, res, next) => {
    let query = { status: 'borrowed' };
    
    // If not admin OR no forceAll flag, show only user's borrows
    if (req.user.role !== 'admin' || !req.query.forceAll) {
      query.user = req.user.id;
    }
  
    const activeBorrows = await BorrowRecord.find(query)
      .populate('book', 'title author')
      .populate('user', 'name email'); // Show user info for admin views
  
    res.status(200).json({
      status: 'success',
      results: activeBorrows.length,
      data: { activeBorrows }
    });
  });

/**
 * @desc    Get the borrowing history for the authenticated user.
 * @route   GET /api/borrows/history
 * @access  Private (Authenticated users)
 */
export const getBorrowHistory = catchAsync(async (req, res, next) => {
    // Determine target user ID
    let targetUserId = req.user.id; // Default to current user
  
    // Admin-specific logic
    if (req.user.role === 'admin' && req.query.userId) {
      // Validate requested user exists
      const userExists = await User.exists({ _id: req.query.userId });
      if (!userExists) {
        return next(new AppError('Specified user not found', 404));
      }
      targetUserId = req.query.userId;
    }
  
    // Fetch history with proper population
    const history = await BorrowRecord.find({ user: targetUserId })
      .populate({
        path: 'book',
        select: 'title author ISBN coverImage' // Include cover image if available
      })
      .sort('-borrowDate')
      .lean(); // Convert to plain JS objects
  
    // Format response differently for admin vs user
    const responseData = req.user.role === 'admin' && req.query.userId
      ? { user: targetUserId, history }
      : { history };
  
    res.status(200).json({
      status: 'success',
      results: history.length,
      data: responseData
    });
  });

/**
 * @desc    Get a list of all currently overdue borrowed books.
 * @route   GET /api/borrows/overdue
 * @access  Private (Admin only)
 */
export const getOverdueBooks = catchAsync(async (req, res, next) => {
    const overdueRecords = await BorrowRecord.find({
        status: 'borrowed',
        dueDate: { $lt: new Date() } // Find records where due date is before now
    })
        .populate('book', 'title author') // Populate book details
        .populate('user', 'name email'); // Populate borrower details

    res.status(200).json({
        status: 'success',
        results: overdueRecords.length,
        data: {
            overdueRecords
        }
    });
});