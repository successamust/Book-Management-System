import BorrowRecord from '../models/BorrowRecord.js';
import Book from '../models/Book.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';


//Borrowing a book
export const borrowBook = catchAsync(async (req, res, next) => {
  const { bookId } = req.params;
  const userId = req.user.id; // From authenticated user

  // 1) Check if book exists and is available
  const book = await Book.findById(bookId);
  if (!book || book.status !== 'available') {
    return next(new AppError('Book not available for borrowing', 400));
  }

  // 2) Prevent duplicate active borrows
  const existingBorrow = await BorrowRecord.findOne({
    book: bookId,
    user: userId,
    status: 'borrowed'
  });
  if (existingBorrow) {
    return next(new AppError('You already borrowed this book', 400));
  }

  // 3) Create borrow record
  const borrowRecord = await BorrowRecord.create({
    book: bookId,
    user: userId,
    borrowDate: Date.now(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days later
    status: 'borrowed'
  });

  // 4) Update book status and available count
  book.available -= 1;
  if (book.available === 0) book.status = 'borrowed';
  await book.save();

  res.status(201).json({
    status: 'success',
    data: {
      borrowRecord
    }
  });
});


//returning a book
export const returnBook = catchAsync(async (req, res, next) => {
    const { bookId } = req.params;
    const userId = req.user.id;
  
    // 1) Find active borrow record
    const borrowRecord = await BorrowRecord.findOne({
      book: bookId,
      user: userId,
      status: 'borrowed'
    });
    if (!borrowRecord) {
      return next(new AppError('No active borrow record found', 404));
    }
  
    // 2) Update borrow record
    borrowRecord.returnDate = Date.now();
    borrowRecord.status = 'returned';
  
    // 3) Check for late returns (fine calculation)
    const daysLate = Math.max(0, Math.floor((borrowRecord.returnDate - borrowRecord.dueDate) / (1000 * 60 * 60 * 24)));
    borrowRecord.fineAmount = daysLate > 0 ? daysLate * 10 : 0; // $10/day fine
  
    await borrowRecord.save();
  
    // 4) Update book status
    const book = await Book.findById(bookId);
    book.available += 1;
    if (book.available > 0) book.status = 'available';
    await book.save();
  
    res.status(200).json({
      status: 'success',
      data: {
        borrowRecord
      }
    });
  });


 //Listing all borrowed books
 export const getActiveBorrows = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
  
    const activeBorrows = await BorrowRecord.find({
      user: userId,
      status: 'borrowed'
    }).populate('book', 'title author'); // Only include book title/author
  
    res.status(200).json({
      status: 'success',
      results: activeBorrows.length,
      data: {
        activeBorrows
      }
    });
  });