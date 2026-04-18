import { Router } from 'express';
import { sendAadhaarOtp, verifyAadhaarOtp, checkLiveness, getKycStatus } from '../controllers/kycController';
import { validateBody } from '../middleware/validation';
import { kycLimiter, generalLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import {
  kycAadhaarSchema,
  kycAadhaarVerifySchema,
  livenessSchema,
} from '../utils/schemas';

const router = Router();

router.use(authenticate);

router.post('/aadhaar', kycLimiter, validateBody(kycAadhaarSchema), sendAadhaarOtp);
router.post('/aadhaar/verify', kycLimiter, validateBody(kycAadhaarVerifySchema), verifyAadhaarOtp);
router.post('/liveness', generalLimiter, validateBody(livenessSchema), checkLiveness);
router.get('/status', generalLimiter, getKycStatus);

export default router;