"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const platformController_1 = require("../controllers/platformController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: process.env.UPLOAD_PATH || './uploads',
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only image and PDF files are allowed'));
        }
    },
});
// All platform routes require authentication
router.use(auth_1.authenticate);
/**
 * @route POST /api/v1/platforms/connect
 * @desc Connect to a platform via OAuth
 * @access Private
 */
router.post('/connect', platformController_1.platformValidators.connect, validation_1.validateRequest, platformController_1.PlatformController.connect);
/**
 * @route GET /api/v1/platforms/callback
 * @desc Handle OAuth callback from platform
 * @access Private
 */
router.get('/callback', platformController_1.PlatformController.callback);
/**
 * @route POST /api/v1/platforms/sync/:platformConnectionId
 * @desc Sync data from connected platform
 * @access Private
 */
router.post('/sync/:platformConnectionId', platformController_1.platformValidators.sync, validation_1.validateRequest, platformController_1.PlatformController.sync);
/**
 * @route GET /api/v1/platforms/connected
 * @desc Get connected platforms for worker
 * @access Private
 */
router.get('/connected', platformController_1.PlatformController.getConnectedPlatforms);
/**
 * @route POST /api/v1/platforms/ocr
 * @desc Process OCR on uploaded document/screenshot
 * @access Private
 */
router.post('/ocr', upload.single('document'), platformController_1.platformValidators.processOCR, validation_1.validateRequest, platformController_1.PlatformController.processOCR);
exports.default = router;
//# sourceMappingURL=platforms.js.map