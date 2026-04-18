"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const credentialsController_1 = require("../controllers/credentialsController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All credential routes require authentication
router.use(auth_1.authenticate);
/**
 * @route GET /api/v1/credentials
 * @desc Get worker's credentials
 * @access Private
 */
router.get('/', credentialsController_1.CredentialsController.getCredentials);
/**
 * @route POST /api/v1/credentials/issue
 * @desc Issue a new credential
 * @access Private
 */
router.post('/issue', credentialsController_1.credentialValidators.issueCredential, validation_1.validateRequest, credentialsController_1.CredentialsController.issueCredential);
/**
 * @route POST /api/v1/credentials/revoke/:credentialId
 * @desc Revoke a credential
 * @access Private
 */
router.post('/revoke/:credentialId', credentialsController_1.credentialValidators.revokeCredential, validation_1.validateRequest, credentialsController_1.CredentialsController.revokeCredential);
/**
 * @route POST /api/v1/credentials/share
 * @desc Share credential with lender
 * @access Private
 */
router.post('/share', credentialsController_1.credentialValidators.shareCredential, validation_1.validateRequest, credentialsController_1.CredentialsController.shareCredential);
/**
 * @route POST /api/v1/credentials/verify
 * @desc Verify credential using ZK proof
 * @access Public (for lenders to verify)
 */
router.post('/verify', credentialsController_1.credentialValidators.verifyCredential, validation_1.validateRequest, credentialsController_1.CredentialsController.verifyCredential);
/**
 * @route GET /api/v1/credentials/stats
 * @desc Get credential statistics
 * @access Private
 */
router.get('/stats', credentialsController_1.CredentialsController.getCredentialStats);
exports.default = router;
//# sourceMappingURL=credentials.js.map