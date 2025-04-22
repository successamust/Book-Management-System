import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'A book must have an author']
  },
  ISBN: {
    type: String,
    required: [true, 'A book must have an ISBN'],
    unique: true
  },
  quantity: {
    type: Number,
    required: [true, 'A book must have a quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  available: {
    type: Number,
    default: function() { return this.quantity; } // Defaults to quantity
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'overdue'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


bookSchema.pre('findOneAndDelete', async function (next) {
  const bookId = this.getQuery()._id;
  const activeBorrows = await BorrowRecord.exists({ book: bookId, status: 'borrowed' });
  if (activeBorrows) {
    throw new AppError('Cannot delete a book with active borrows', 400);
  }
  next();
});


const Book = mongoose.model('Book', bookSchema);
export default Book;