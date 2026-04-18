import { z } from 'zod';

export const authSendOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
  role: z.enum(['WORKER', 'LENDER', 'ADMIN']),
});

export const authVerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const kycAadhaarSchema = z.object({
  aadhaarNumber: z.string().length(12, 'Aadhaar must be 12 digits'),
});

export const kycAadhaarVerifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const livenessSchema = z.object({
  frameBase64: z.string(),
});

export const platformConnectSchema = z.object({
  platform: z.string(),
  authCode: z.string(),
});

export const ocrSchema = z.object({
  imageBase64: z.string(),
  platform: z.string(),
});

export const syncSchema = z.object({
  platformId: z.string().uuid(),
});

export const credentialZkProofSchema = z.object({
  credentialId: z.string().uuid(),
});

export const incomeManualSchema = z.object({
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  source: z.string(),
  notes: z.string().optional(),
});

export const accessCreateSchema = z.object({
  scope: z.array(z.string()),
  duration: z.number().int().min(1).max(8760), // max 1 year in hours
  lenderId: z.string().uuid().optional(),
});

export const attestationRequestSchema = z.object({
  targetPhone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
  relationship: z.enum(['COWORKER', 'NEIGHBOR', 'COLLABORATED']),
});

export const attestationSignSchema = z.object({
  statement: z.string().max(280),
});

export const lenderRegisterSchema = z.object({
  orgDetails: z.object({
    name: z.string(),
    type: z.string(),
    licenseNumber: z.string(),
    gstNumber: z.string(),
  }),
  contactDetails: z.object({
    fullName: z.string(),
    designation: z.string(),
    email: z.string().email(),
    phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
  }),
});

export const adminLenderActionSchema = z.object({
  reason: z.string().optional(),
});

export const whatsappJwtSchema = z.object({
  jwt: z.string(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const tokenParamSchema = z.object({
  token: z.string(),
});