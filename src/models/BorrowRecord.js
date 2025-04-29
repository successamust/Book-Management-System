import mongoose from 'mongoose';

// Define schema for book borrowing records
const borrowRecordSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'A borrow record must reference a book']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A borrow record must reference a user']
  },
  borrowDate: {
    type: Date,
    default: Date.now  // Automatically set to current date when created
  },
  dueDate: Date,      // Expected return date (set when borrowing)
  returnDate: Date,    // Actual return date (set when returning)
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],  // Possible status values
    default: 'borrowed'  // New records start as 'borrowed'
  },
  fineAmount: {
    type: Number,
    default: 0  // No fine initially
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

/**
 * Calculates overdue fines for borrowed books
 * @returns {Number} - Calculated fine amount in dollars
 */
borrowRecordSchema.methods.calculateFine = function() {
  // Only calculate if book is overdue
  if (this.status !== 'overdue') return 0;
  
  // Calculate due date (14 days from borrow date)
  const dueDate = new Date(this.borrowDate);
  dueDate.setDate(dueDate.getDate() + 14);
  
  // Calculate days late (rounded down to whole days)
  const daysLate = Math.max(0, Math.floor((Date.now() - dueDate) / (1000 * 60 * 60 * 24)));
  
  // $1 per day fine
  return daysLate * 1;
};

// Create and export the BorrowRecord model
const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
export default BorrowRecord;