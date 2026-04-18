"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const peerAttestationController_1 = require("../controllers/peerAttestationController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * @route POST /api/v1/attestations
 * @desc Create a peer attestation
 * @access Private
 */
router.post('/', peerAttestationController_1.peerAttestationValidators.createAttestation, validation_1.validateRequest, peerAttestationController_1.PeerAttestationController.createAttestation);
/**
 * @route GET /api/v1/attestations/received/:workerId
 * @desc Get attestations received by a worker
 * @access Private
 */
router.get('/received/:workerId', peerAttestationController_1.PeerAttestationController.getAttestations);
/**
 * @route GET /api/v1/attestations/given
 * @desc Get attestations given by current user
 * @access Private
 */
router.get('/given', peerAttestationController_1.PeerAttestationController.getGivenAttestations);
/**
 * @route PUT /api/v1/attestations/:attestationId
 * @desc Update an attestation
 * @access Private (Attester only)
 */
router.put('/:attestationId', peerAttestationController_1.peerAttestationValidators.updateAttestation, validation_1.validateRequest, peerAttestationController_1.PeerAttestationController.updateAttestation);
/**
 * @route DELETE /api/v1/attestations/:attestationId
 * @desc Delete an attestation
 * @access Private (Attester/Admin only)
 */
router.delete('/:attestationId', peerAttestationController_1.peerAttestationValidators.deleteAttestation, validation_1.validateRequest, peerAttestationController_1.PeerAttestationController.deleteAttestation);
/**
 * @route GET /api/v1/attestations/verify/:attestationId
 * @desc Verify attestation signature
 * @access Private
 */
router.get('/verify/:attestationId', peerAttestationController_1.peerAttestationValidators.verifyAttestation, validation_1.validateRequest, peerAttestationController_1.PeerAttestationController.verifyAttestation);
/**
 * @route GET /api/v1/attestations/stats
 * @desc Get attestation statistics
 * @access Private
 */
router.get('/stats', peerAttestationController_1.PeerAttestationController.getAttestationStats);
exports.default = router;
//# sourceMappingURL=attestations.js.map