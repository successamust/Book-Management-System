import Book from '../models/Book.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Add a new book to the library.
 * @route   POST /api/books
 * @access  Private (Admin only)
 */
export const createBook = catchAsync(async (req, res, next) => {
    const { title, author, ISBN, quantity } = req.body;

    if (!title || !author || !ISBN || quantity === undefined) {
        return next(new AppError('Please provide title, author, ISBN, and quantity.', 400));
    }

    const existingBook = await Book.findOne({ ISBN });
    if (existingBook) {
        return next(new AppError('A book with this ISBN already exists.', 400));
    }

    const newBook = await Book.create({
        title,
        author,
        ISBN,
        quantity,
        available: quantity // Initialize available copies
    });

    res.status(201).json({
        status: 'success',
        data: {
            book: newBook
        }
    });
});

/**
 * @desc    Get all books, with optional filtering, sorting, limiting, and pagination.
 * @route   GET /api/books
 * @access  Public
 */
export const getAllBooks = catchAsync(async (req, res) => {
    const features = new APIFeatures(Book.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const books = await features.query;

    res.status(200).json({
        status: 'success',
        results: books.length,
        data: {
            books
        }
    });
});

/**
 * @desc    Get a single book by its ID.
 * @route   GET /api/books/:id
 * @access  Public
 */
export const getBook = catchAsync(async (req, res, next) => {
    const book = await Book.findById(req.params.id)
        .populate({
            path: 'borrower',
            select: 'name email' // Select specific fields from the borrower
        })
        .select('-__v'); // Exclude the version key

    if (!book) {
        return next(new AppError('No book found with the provided ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            book
        }
    });
});

/**
 * @desc    Update an existing book's details (admin-only). Uses PATCH for partial updates.
 * @route   PATCH /api/books/:id
 * @access  Private (Admin only)
 */
export const updateBook = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, author, ISBN, quantity } = req.body;

    if (!title && !author && !ISBN && quantity === undefined) {
        return next(new AppError('At least one field (title, author, ISBN, or quantity) must be provided for update.', 400));
    }

    const book = await Book.findById(id);
    if (!book) {
        return next(new AppError('No book found with the provided ID.', 404));
    }

    // Calculate the change in quantity to adjust available copies
    if (quantity !== undefined && quantity !== book.quantity) {
        book.available += quantity - book.quantity;
    }

    // Apply updates
    if (title) book.title = title;
    if (author) book.author = author;
    if (ISBN) book.ISBN = ISBN;
    if (quantity !== undefined) book.quantity = quantity;

    const updatedBook = await book.save();

    res.status(200).json({
        status: 'success',
        data: {
            book: updatedBook
        }
    });
});

/**
 * @desc    Delete a book from the library (admin-only).
 * @route   DELETE /api/books/:id
 * @access  Private (Admin only)
 */
export const deleteBook = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
        return next(new AppError('No book found with the provided ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null // 204 No Content responses typically have no body
    });
});