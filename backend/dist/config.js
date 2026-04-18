"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ override: true });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env'), override: true });
exports.config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY,
    },
    blockchain: {
        polygonRpcUrl: process.env.POLYGON_RPC_URL,
        privateKey: process.env.PRIVATE_KEY,
    },
    sms: {
        apiKey: process.env.SMS_API_KEY || 'mock-sms-api-key',
        apiUrl: process.env.SMS_API_URL || 'https://mock-sms-provider.com/send',
    },
    fileUpload: {
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    },
    rateLimit: {
        auth: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
        kyc: parseInt(process.env.RATE_LIMIT_KYC || '3'),
        general: parseInt(process.env.RATE_LIMIT_GENERAL || '100'),
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
    admin: {
        phone: process.env.ADMIN_PHONE || '+919999999999',
    },
};
// Validate required environment variables
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'POLYGON_RPC_URL',
    'PRIVATE_KEY',
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}
//# sourceMappingURL=config.js.map