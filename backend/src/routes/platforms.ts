import express from 'express';
import multer from 'multer';
import { PlatformController, platformValidators } from '../controllers/platformController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: process.env.UPLOAD_PATH || './uploads',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

// All platform routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/platforms/connect
 * @desc Connect to a platform via OAuth
 * @access Private
 */
router.post(
  '/connect',
  platformValidators.connect,
  validateRequest,
  PlatformController.connect
);

/**
 * @route GET /api/v1/platforms/callback
 * @desc Handle OAuth callback from platform
 * @access Private
 */
router.get('/callback', PlatformController.callback);

/**
 * @route POST /api/v1/platforms/sync/:platformConnectionId
 * @desc Sync data from connected platform
 * @access Private
 */
router.post(
  '/sync/:platformConnectionId',
  platformValidators.sync,
  validateRequest,
  PlatformController.sync
);

/**
 * @route GET /api/v1/platforms/connected
 * @desc Get connected platforms for worker
 * @access Private
 */
router.get('/connected', PlatformController.getConnectedPlatforms);

/**
 * @route POST /api/v1/platforms/ocr
 * @desc Process OCR on uploaded document/screenshot
 * @access Private
 */
router.post(
  '/ocr',
  upload.single('document'),
  platformValidators.processOCR,
  validateRequest,
  PlatformController.processOCR
);

export default router;