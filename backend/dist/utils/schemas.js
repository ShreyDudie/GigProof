"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenParamSchema = exports.uuidParamSchema = exports.whatsappJwtSchema = exports.adminLenderActionSchema = exports.lenderRegisterSchema = exports.attestationSignSchema = exports.attestationRequestSchema = exports.accessCreateSchema = exports.incomeManualSchema = exports.credentialZkProofSchema = exports.syncSchema = exports.ocrSchema = exports.platformConnectSchema = exports.livenessSchema = exports.kycAadhaarVerifySchema = exports.kycAadhaarSchema = exports.refreshTokenSchema = exports.authVerifyOtpSchema = exports.authSendOtpSchema = void 0;
const zod_1 = require("zod");
exports.authSendOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
    role: zod_1.z.enum(['WORKER', 'LENDER', 'ADMIN']),
});
exports.authVerifyOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
exports.kycAadhaarSchema = zod_1.z.object({
    aadhaarNumber: zod_1.z.string().length(12, 'Aadhaar must be 12 digits'),
});
exports.kycAadhaarVerifySchema = zod_1.z.object({
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
exports.livenessSchema = zod_1.z.object({
    frameBase64: zod_1.z.string(),
});
exports.platformConnectSchema = zod_1.z.object({
    platform: zod_1.z.string(),
    authCode: zod_1.z.string(),
});
exports.ocrSchema = zod_1.z.object({
    imageBase64: zod_1.z.string(),
    platform: zod_1.z.string(),
});
exports.syncSchema = zod_1.z.object({
    platformId: zod_1.z.string().uuid(),
});
exports.credentialZkProofSchema = zod_1.z.object({
    credentialId: zod_1.z.string().uuid(),
});
exports.incomeManualSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    source: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
exports.accessCreateSchema = zod_1.z.object({
    scope: zod_1.z.array(zod_1.z.string()),
    duration: zod_1.z.number().int().min(1).max(8760), // max 1 year in hours
    lenderId: zod_1.z.string().uuid().optional(),
});
exports.attestationRequestSchema = zod_1.z.object({
    targetPhone: zod_1.z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
    relationship: zod_1.z.enum(['COWORKER', 'NEIGHBOR', 'COLLABORATED']),
});
exports.attestationSignSchema = zod_1.z.object({
    statement: zod_1.z.string().max(280),
});
exports.lenderRegisterSchema = zod_1.z.object({
    orgDetails: zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        licenseNumber: zod_1.z.string(),
        gstNumber: zod_1.z.string(),
    }),
    contactDetails: zod_1.z.object({
        fullName: zod_1.z.string(),
        designation: zod_1.z.string(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
    }),
});
exports.adminLenderActionSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
exports.whatsappJwtSchema = zod_1.z.object({
    jwt: zod_1.z.string(),
});
exports.uuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.tokenParamSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
//# sourceMappingURL=schemas.js.map