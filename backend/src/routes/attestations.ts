import express from 'express';
import { PeerAttestationController, peerAttestationValidators } from '../controllers/peerAttestationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/attestations
 * @desc Create a peer attestation
 * @access Private
 */
router.post(
  '/',
  peerAttestationValidators.createAttestation,
  validateRequest,
  PeerAttestationController.createAttestation
);

/**
 * @route GET /api/v1/attestations/received/:workerId
 * @desc Get attestations received by a worker
 * @access Private
 */
router.get('/received/:workerId', PeerAttestationController.getAttestations);

/**
 * @route GET /api/v1/attestations/given
 * @desc Get attestations given by current user
 * @access Private
 */
router.get('/given', PeerAttestationController.getGivenAttestations);

/**
 * @route PUT /api/v1/attestations/:attestationId
 * @desc Update an attestation
 * @access Private (Attester only)
 */
router.put(
  '/:attestationId',
  peerAttestationValidators.updateAttestation,
  validateRequest,
  PeerAttestationController.updateAttestation
);

/**
 * @route DELETE /api/v1/attestations/:attestationId
 * @desc Delete an attestation
 * @access Private (Attester/Admin only)
 */
router.delete(
  '/:attestationId',
  peerAttestationValidators.deleteAttestation,
  validateRequest,
  PeerAttestationController.deleteAttestation
);

/**
 * @route GET /api/v1/attestations/verify/:attestationId
 * @desc Verify attestation signature
 * @access Private
 */
router.get(
  '/verify/:attestationId',
  peerAttestationValidators.verifyAttestation,
  validateRequest,
  PeerAttestationController.verifyAttestation
);

/**
 * @route GET /api/v1/attestations/stats
 * @desc Get attestation statistics
 * @access Private
 */
router.get('/stats', PeerAttestationController.getAttestationStats);

export default router;