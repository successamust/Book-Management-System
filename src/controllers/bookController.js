import Book from '../models/Book.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';


//adding new books
export const createBook = catchAsync(async (req, res, next) => {
  const { title, author, ISBN, quantity } = req.body;

  // Check if ISBN already exists
  const existingBook = await Book.findOne({ ISBN });
  if (existingBook) {
    return next(new AppError('Book with this ISBN already exists', 400));
  }

  const newBook = await Book.create({
    title,
    author,
    ISBN,
    quantity
  });

  res.status(201).json({
    status: 'success',
    data: {
      book: newBook
    }
  });
});

//Getting all books
export const getAllBooks = catchAsync(async (req, res) => {
  // 1) Build query
  const features = new APIFeatures(Book.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // 2) Execute query
  const books = await features.query;

  res.status(200).json({
    status: 'success',
    results: books.length,
    data: {
      books
    }
  });
});

export const getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)
    .populate('borrower', 'name email') // shows who borrowed it
    .select('-__v'); // Exclude version key

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});