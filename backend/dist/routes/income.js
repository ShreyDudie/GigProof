"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const incomeController_1 = require("../controllers/incomeController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// All income routes require authentication
router.use(auth_1.authenticate);
/**
 * @route GET /api/v1/income
 * @desc Get worker's income records
 * @access Private
 */
router.get('/', incomeController_1.IncomeController.getIncomeRecords);
/**
 * @route POST /api/v1/income
 * @desc Add manual income record
 * @access Private
 */
router.post('/', incomeController_1.incomeValidators.addIncomeRecord, validation_1.validateRequest, incomeController_1.IncomeController.addIncomeRecord);
/**
 * @route PUT /api/v1/income/:recordId
 * @desc Update income record
 * @access Private
 */
router.put('/:recordId', incomeController_1.incomeValidators.updateIncomeRecord, validation_1.validateRequest, incomeController_1.IncomeController.updateIncomeRecord);
/**
 * @route DELETE /api/v1/income/:recordId
 * @desc Delete income record
 * @access Private
 */
router.delete('/:recordId', incomeController_1.incomeValidators.deleteIncomeRecord, validation_1.validateRequest, incomeController_1.IncomeController.deleteIncomeRecord);
/**
 * @route GET /api/v1/income/analytics
 * @desc Get income analytics
 * @access Private
 */
router.get('/analytics', incomeController_1.IncomeController.getIncomeAnalytics);
/**
 * @route POST /api/v1/income/verify/:recordId
 * @desc Verify income record (admin/lender only)
 * @access Private (Admin/Lender)
 */
router.post('/verify/:recordId', incomeController_1.incomeValidators.verifyIncomeRecord, validation_1.validateRequest, incomeController_1.IncomeController.verifyIncomeRecord);
exports.default = router;
//# sourceMappingURL=income.js.map