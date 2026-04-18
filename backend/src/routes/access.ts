import express from 'express';
import { AccessController, accessValidators } from '../controllers/accessController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Public route for token validation
router.get('/validate', AccessController.validateAccessToken);

// All other routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/access/request
 * @desc Request access to worker data
 * @access Private (Lenders)
 */
router.post(
  '/request',
  accessValidators.requestAccess,
  validateRequest,
  AccessController.requestAccess
);

/**
 * @route GET /api/v1/access/requests
 * @desc Get access requests
 * @access Private
 */
router.get('/requests', AccessController.getAccessRequests);

/**
 * @route POST /api/v1/access/respond/:requestId
 * @desc Approve or deny access request
 * @access Private (Workers/Admins)
 */
router.post(
  '/respond/:requestId',
  accessValidators.respondToAccessRequest,
  validateRequest,
  AccessController.respondToAccessRequest
);

/**
 * @route POST /api/v1/access/revoke/:requestId
 * @desc Revoke access token
 * @access Private
 */
router.post(
  '/revoke/:requestId',
  accessValidators.revokeAccess,
  validateRequest,
  AccessController.revokeAccess
);

/**
 * @route GET /api/v1/access/consent-logs
 * @desc Get consent logs
 * @access Private
 */
router.get('/consent-logs', AccessController.getConsentLogs);

export default router;