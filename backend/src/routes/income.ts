import express from 'express';
import { IncomeController, incomeValidators } from '../controllers/incomeController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// All income routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/income
 * @desc Get worker's income records
 * @access Private
 */
router.get('/', IncomeController.getIncomeRecords);

/**
 * @route POST /api/v1/income
 * @desc Add manual income record
 * @access Private
 */
router.post(
  '/',
  incomeValidators.addIncomeRecord,
  validateRequest,
  IncomeController.addIncomeRecord
);

/**
 * @route PUT /api/v1/income/:recordId
 * @desc Update income record
 * @access Private
 */
router.put(
  '/:recordId',
  incomeValidators.updateIncomeRecord,
  validateRequest,
  IncomeController.updateIncomeRecord
);

/**
 * @route DELETE /api/v1/income/:recordId
 * @desc Delete income record
 * @access Private
 */
router.delete(
  '/:recordId',
  incomeValidators.deleteIncomeRecord,
  validateRequest,
  IncomeController.deleteIncomeRecord
);

/**
 * @route GET /api/v1/income/analytics
 * @desc Get income analytics
 * @access Private
 */
router.get('/analytics', IncomeController.getIncomeAnalytics);

/**
 * @route POST /api/v1/income/verify/:recordId
 * @desc Verify income record (admin/lender only)
 * @access Private (Admin/Lender)
 */
router.post(
  '/verify/:recordId',
  incomeValidators.verifyIncomeRecord,
  validateRequest,
  IncomeController.verifyIncomeRecord
);

export default router;