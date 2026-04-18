"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kycController_1 = require("../controllers/kycController");
const validation_1 = require("../middleware/validation");
const rateLimit_1 = require("../middleware/rateLimit");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../utils/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/aadhaar', rateLimit_1.kycLimiter, (0, validation_1.validateBody)(schemas_1.kycAadhaarSchema), kycController_1.sendAadhaarOtp);
router.post('/aadhaar/verify', rateLimit_1.kycLimiter, (0, validation_1.validateBody)(schemas_1.kycAadhaarVerifySchema), kycController_1.verifyAadhaarOtp);
router.post('/liveness', rateLimit_1.generalLimiter, (0, validation_1.validateBody)(schemas_1.livenessSchema), kycController_1.checkLiveness);
router.get('/status', rateLimit_1.generalLimiter, kycController_1.getKycStatus);
exports.default = router;
//# sourceMappingURL=kyc.js.map