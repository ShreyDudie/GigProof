import express from 'express';
import { VerifyController, verifyValidators } from '../controllers/verifyController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Public route for worker verification (with token)
router.get(
  '/worker',
  verifyValidators.verifyWorker,
  validateRequest,
  VerifyController.verifyWorker
);

// All other routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/verify/lender/dashboard
 * @desc Get lender dashboard data
 * @access Private (Lenders)
 */
router.get('/lender/dashboard', VerifyController.getLenderDashboard);

/**
 * @route POST /api/v1/verify/lender/register
 * @desc Register new lender
 * @access Public
 */
router.post(
  '/lender/register',
  verifyValidators.registerLender,
  validateRequest,
  VerifyController.registerLender
);

/**
 * @route POST /api/v1/verify/admin/lender/:lenderId/approve
 * @desc Admin: Approve or reject lender registration
 * @access Private (Admin)
 */
router.post(
  '/admin/lender/:lenderId/approve',
  verifyValidators.approveLender,
  validateRequest,
  VerifyController.approveLender
);

/**
 * @route GET /api/v1/verify/admin/lenders
 * @desc Admin: Get all lenders
 * @access Private (Admin)
 */
router.get('/admin/lenders', VerifyController.getLenders);

/**
 * @route GET /api/v1/verify/admin/health
 * @desc Admin: Get system health metrics
 * @access Private (Admin)
 */
router.get('/admin/health', VerifyController.getSystemHealth);

export default router;