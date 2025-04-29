import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan'; 
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import borrowRouter from './routes/borrowRoutes.js';
import globalErrorHandler from './controllers/errorController.js';
import setupCronJobs from './utils/cron.js';
import fineRouter from './routes/fineRoutes.js';

dotenv.config();
connectDB();
setupCronJobs();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev')); // <-- Logs requests in the console

app.use((req, res, next) => {
  console.log('Request headers:', req.headers);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRouter);
app.use('/api/fines', fineRouter);

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});