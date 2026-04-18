"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accessController_1 = require("../controllers/accessController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Public route for token validation
router.get('/validate', accessController_1.AccessController.validateAccessToken);
// All other routes require authentication
router.use(auth_1.authenticate);
/**
 * @route POST /api/v1/access/request
 * @desc Request access to worker data
 * @access Private (Lenders)
 */
router.post('/request', accessController_1.accessValidators.requestAccess, validation_1.validateRequest, accessController_1.AccessController.requestAccess);
/**
 * @route GET /api/v1/access/requests
 * @desc Get access requests
 * @access Private
 */
router.get('/requests', accessController_1.AccessController.getAccessRequests);
/**
 * @route POST /api/v1/access/respond/:requestId
 * @desc Approve or deny access request
 * @access Private (Workers/Admins)
 */
router.post('/respond/:requestId', accessController_1.accessValidators.respondToAccessRequest, validation_1.validateRequest, accessController_1.AccessController.respondToAccessRequest);
/**
 * @route POST /api/v1/access/revoke/:requestId
 * @desc Revoke access token
 * @access Private
 */
router.post('/revoke/:requestId', accessController_1.accessValidators.revokeAccess, validation_1.validateRequest, accessController_1.AccessController.revokeAccess);
/**
 * @route GET /api/v1/access/consent-logs
 * @desc Get consent logs
 * @access Private
 */
router.get('/consent-logs', accessController_1.AccessController.getConsentLogs);
exports.default = router;
//# sourceMappingURL=access.js.map