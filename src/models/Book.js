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

const Book = mongoose.model('Book', bookSchema);
export default Book;