import { Router } from 'express';
import { sendOtp, verifyOtp, refreshToken, logout } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import {
  authSendOtpSchema,
  authVerifyOtpSchema,
  refreshTokenSchema,
} from '../utils/schemas';

const router = Router();

router.post('/send-otp', authLimiter, validateBody(authSendOtpSchema), sendOtp);
router.post('/verify-otp', authLimiter, validateBody(authVerifyOtpSchema), verifyOtp);
router.post('/refresh', validateBody(refreshTokenSchema), refreshToken);
router.delete('/logout', authenticate, logout);

export default router;