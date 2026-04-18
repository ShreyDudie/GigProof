"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const rateLimit_1 = require("../middleware/rateLimit");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../utils/schemas");
const router = (0, express_1.Router)();
router.post('/send-otp', rateLimit_1.authLimiter, (0, validation_1.validateBody)(schemas_1.authSendOtpSchema), authController_1.sendOtp);
router.post('/verify-otp', rateLimit_1.authLimiter, (0, validation_1.validateBody)(schemas_1.authVerifyOtpSchema), authController_1.verifyOtp);
router.post('/refresh', (0, validation_1.validateBody)(schemas_1.refreshTokenSchema), authController_1.refreshToken);
router.delete('/logout', auth_1.authenticate, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map