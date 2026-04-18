import express from 'express';
import { CredentialsController, credentialValidators } from '../controllers/credentialsController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// All credential routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/credentials
 * @desc Get worker's credentials
 * @access Private
 */
router.get('/', CredentialsController.getCredentials);

/**
 * @route POST /api/v1/credentials/issue
 * @desc Issue a new credential
 * @access Private
 */
router.post(
  '/issue',
  credentialValidators.issueCredential,
  validateRequest,
  CredentialsController.issueCredential
);

/**
 * @route POST /api/v1/credentials/revoke/:credentialId
 * @desc Revoke a credential
 * @access Private
 */
router.post(
  '/revoke/:credentialId',
  credentialValidators.revokeCredential,
  validateRequest,
  CredentialsController.revokeCredential
);

/**
 * @route POST /api/v1/credentials/share
 * @desc Share credential with lender
 * @access Private
 */
router.post(
  '/share',
  credentialValidators.shareCredential,
  validateRequest,
  CredentialsController.shareCredential
);

/**
 * @route POST /api/v1/credentials/verify
 * @desc Verify credential using ZK proof
 * @access Public (for lenders to verify)
 */
router.post(
  '/verify',
  credentialValidators.verifyCredential,
  validateRequest,
  CredentialsController.verifyCredential
);

/**
 * @route GET /api/v1/credentials/stats
 * @desc Get credential statistics
 * @access Private
 */
router.get('/stats', CredentialsController.getCredentialStats);

export default router;