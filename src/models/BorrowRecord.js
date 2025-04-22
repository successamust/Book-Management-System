import mongoose from 'mongoose';

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
    default: Date.now
  },
  dueDate: Date,
  returnDate: Date,
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],
    default: 'borrowed'
  },

  fineAmount: {
    type: Number,
    default: 0
  },
  
},
    {
        timeStamps: true  
    }
);

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
export default BorrowRecord;