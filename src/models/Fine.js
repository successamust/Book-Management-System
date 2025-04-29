import mongoose from 'mongoose';

/**
 * Fine Schema:
 * Tracks financial penalties for overdue book returns
 * Relates to both users and borrowing records
 */
const FineSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true  // Must reference the user who owes the fine
  },
  borrowRecordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BorrowingRecord', 
    required: true  // Must reference the associated borrowing record
  },
  amount: { 
    type: Number, 
    required: true  // Fine amount in dollars
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid'],  // Only these statuses allowed
    default: 'pending'  // Automatically set to pending when created
  },
  paidAt: { 
    type: Date  // Timestamp when fine was paid (null if unpaid)
  },
}, { 
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Create the Fine model from the schema
const Fine = mongoose.model('Fine', FineSchema);

export default Fine;