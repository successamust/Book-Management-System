import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * User Schema:
 * Defines the structure for user accounts in the system
 * Includes authentication fields and account management properties
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true  // Removes whitespace from both ends
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // Ensures no duplicate emails
    lowercase: true,  // Converts to lowercase before saving
    validate: [validator.isEmail, 'Invalid email']  // Email format validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Never returned in query results by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],  // Only these roles allowed
    default: 'user'  // New users get 'user' role by default
  },
  createdAt: {
    type: Date,
    default: Date.now  // Automatically set to current date
  },
  active: {
    type: Boolean,
    default: true,  // Accounts are active by default
    select: false  // Hidden from query results by default
  },
  passwordResetToken: {
    type: String,
    select: false  // Hide from queries
  },
  passwordResetExpires: {
    type: Date,
    select: false  // Hide from queries
  }
}, { 
  timestamps: true 
});


/**
 * Generates a password reset token
 * - Creates cryptographically secure token
 * - Stores hashed version in database
 * - Sets 10-minute expiration
 * @returns {string} Unhashed token for email
 */
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Store hashed version in database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiration to 10 minutes from now
  this.passwordResetExpires = Date.now() + 20 * 60 * 1000;
  
  return resetToken; // Return unhashed version for email
};

userSchema.index({ passwordResetToken: 1 });
userSchema.index({ passwordResetExpires: 1 });

/**
 * Compares candidate password with stored password
 * @param {string} candidatePassword - Password to check
 * @param {string} userPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.correctPassword = async function(
  candidatePassword, 
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Password hashing middleware
 * Automatically hashes password before saving if modified
 */
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost factor of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Create and export the User model
const User = mongoose.model('User', userSchema);
export default User;