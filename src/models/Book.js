import mongoose from 'mongoose';
import BorrowRecord from '../models/BorrowRecord.js';

// Define the book schema with required fields and validations
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    trim: true  // Removes whitespace from both ends
  },
  author: {
    type: String,
    required: [true, 'A book must have an author']
  },
  ISBN: {
    type: String,
    required: [true, 'A book must have an ISBN'],
    unique: true  // Ensures no duplicate ISBNs
  },
  quantity: {
    type: Number,
    required: [true, 'A book must have a quantity'],
    min: [1, 'Quantity must be at least 1']  // Minimum quantity validation
  },
  available: {
    type: Number,
    default: function() { return this.quantity; }  // Defaults to total quantity when created
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // References the User model
    default: null  // No borrower by default
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'overdue'],  // Only these values allowed
    default: 'available'  // Default status
  },
  createdAt: {
    type: Date,
    default: Date.now  // Sets to current date when created
  }
});

// Middleware to prevent deleting books that are currently borrowed
bookSchema.pre('findOneAndDelete', async function (next) {
  const bookId = this.getQuery()._id;
  // Check if there are any active borrow records for this book
  const activeBorrows = await BorrowRecord.exists({ book: bookId, status: 'borrowed' });
  if (activeBorrows) {
    throw new AppError('Cannot delete a book with active borrows', 400);
  }
  next();  // Proceed with deletion if no active borrows
});

// Create the Book model from the schema
const Book = mongoose.model('Book', bookSchema);

export default Book;