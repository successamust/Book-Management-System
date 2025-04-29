import BorrowRecord from '../models/BorrowRecord.js';
import Fine from '../models/Fine.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * @desc    Get all fines for the authenticated user (or all fines for admin).
 * @route   GET /api/fines
 * @access  Private (Authenticated users, Admin)
 */
export const getFines = catchAsync(async (req, res, next) => {
    // Admins can see all fines, users can only see their own
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const fines = await Fine.find(query)
        .populate('userId', 'name email') // Populate user details
        .populate('borrowRecordId'); // Populate the associated borrow record

    res.status(200).json({
        status: 'success',
        results: fines.length,
        data: { fines }
    });
});

/**
 * @desc    Pay a specific fine by its ID.
 * @route   PATCH /api/fines/:id/pay
 * @access  Private (Authenticated users who own the fine, Admin)
 */
export const payFine = catchAsync(async (req, res, next) => {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
        return next(new AppError('No fine found with that ID.', 404));
    }

    // Allow the user who owns the fine or an admin to pay
    if (fine.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('You are not authorized to pay this fine.', 403));
    }

    fine.status = 'paid';
    fine.paidAt = Date.now();
    await fine.save();

    res.status(200).json({
        status: 'success',
        data: { fine }
    });
});

/**
 * @desc    Calculate and create fines for overdue borrow records.
 * @route   POST /api/fines/calculate
 * @access  Private (Admin only)
 */
export const calculateFines = catchAsync(async (req, res, next) => {
    // Find all borrow records that are overdue and not yet returned
    const overdueRecords = await BorrowRecord.find({
        status: 'borrowed', // 'borrowed' status implies not yet returned
        dueDate: { $lt: new Date() }, // Due date is in the past
        returnDate: { $exists: false } // Has not been returned yet
    });

    // Iterate through overdue records and create fines if they don't exist
    await Promise.all(overdueRecords.map(async (record) => {
        const existingFine = await Fine.findOne({ borrowRecordId: record._id });
        if (!existingFine) {
            // The BorrowRecord model has a method to calculate the fine
            const fineAmount = record.calculateFine ? await record.calculateFine() : 0;
            if (fineAmount > 0) {
                await Fine.create({
                    userId: record.userId,
                    borrowRecordId: record._id,
                    amount: fineAmount,
                });
            }
        }
    }));

    res.status(200).json({
        status: 'success',
        message: `Successfully calculated fines for ${overdueRecords.length} overdue records.`
    });
});