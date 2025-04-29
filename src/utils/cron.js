import cron from 'node-cron';
import { calculateFines } from '../controllers/fineController.js';
import AppError from '../utils/AppError.js';

const mockRequest = { user: { role: 'admin' } };
const mockResponse = {
  json: (data) => console.log(`Cron: ${data.message}`),
  status: () => mockResponse
};

const mockNext = (error) => {
  if (error) console.error('Cron Error:', error.message);
};

// Run daily at midnight
const setupCronJobs = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('🔹 Running scheduled fine calculation...');
    calculateFines(mockRequest, mockResponse, mockNext);
  });
};

export default setupCronJobs;