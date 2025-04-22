import Book from '../models/Book.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/AppError.js';


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


 //getting a book 
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

 // Update a book (admin-only) - NOW USING PATCH
export const updateBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, author, ISBN, quantity } = req.body;

  // Validate at least one field is provided
  if (!title && !author && !ISBN && !quantity) {
    return next(new AppError('At least one field (title, author, ISBN, or quantity) must be updated', 400));
  }

  // Find the book first to calculate available copies
  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  // Apply partial updates
  if (title) book.title = title;
  if (author) book.author = author;
  if (ISBN) book.ISBN = ISBN;
  if (quantity !== undefined) {
    book.available += quantity - book.quantity; // Adjust available copies
    book.quantity = quantity;
  }

  // Save with validation
  const updatedBook = await book.save();

  res.status(200).json({
    status: 'success',
    data: {
      book: updatedBook
    }
  });
});


// Delete a book (admin-only)
export const deleteBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // 1) Check if the book exists and delete it
  const book = await Book.findByIdAndDelete(id);

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  // 2) Success response (no content)
  res.status(204).json({
    status: 'success',
    data: null
  });
});