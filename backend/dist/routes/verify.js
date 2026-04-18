"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyController_1 = require("../controllers/verifyController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Public route for worker verification (with token)
router.get('/worker', verifyController_1.verifyValidators.verifyWorker, validation_1.validateRequest, verifyController_1.VerifyController.verifyWorker);
// All other routes require authentication
router.use(auth_1.authenticate);
/**
 * @route GET /api/v1/verify/lender/dashboard
 * @desc Get lender dashboard data
 * @access Private (Lenders)
 */
router.get('/lender/dashboard', verifyController_1.VerifyController.getLenderDashboard);
/**
 * @route POST /api/v1/verify/lender/register
 * @desc Register new lender
 * @access Public
 */
router.post('/lender/register', verifyController_1.verifyValidators.registerLender, validation_1.validateRequest, verifyController_1.VerifyController.registerLender);
/**
 * @route POST /api/v1/verify/admin/lender/:lenderId/approve
 * @desc Admin: Approve or reject lender registration
 * @access Private (Admin)
 */
router.post('/admin/lender/:lenderId/approve', verifyController_1.verifyValidators.approveLender, validation_1.validateRequest, verifyController_1.VerifyController.approveLender);
/**
 * @route GET /api/v1/verify/admin/lenders
 * @desc Admin: Get all lenders
 * @access Private (Admin)
 */
router.get('/admin/lenders', verifyController_1.VerifyController.getLenders);
/**
 * @route GET /api/v1/verify/admin/health
 * @desc Admin: Get system health metrics
 * @access Private (Admin)
 */
router.get('/admin/health', verifyController_1.VerifyController.getSystemHealth);
exports.default = router;
//# sourceMappingURL=verify.js.map