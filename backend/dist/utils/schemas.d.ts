import { z } from 'zod';
export declare const authSendOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    role: z.ZodEnum<{
        WORKER: "WORKER";
        LENDER: "LENDER";
        ADMIN: "ADMIN";
    }>;
}, z.core.$strip>;
export declare const authVerifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const kycAadhaarSchema: z.ZodObject<{
    aadhaarNumber: z.ZodString;
}, z.core.$strip>;
export declare const kycAadhaarVerifySchema: z.ZodObject<{
    otp: z.ZodString;
}, z.core.$strip>;
export declare const livenessSchema: z.ZodObject<{
    frameBase64: z.ZodString;
}, z.core.$strip>;
export declare const platformConnectSchema: z.ZodObject<{
    platform: z.ZodString;
    authCode: z.ZodString;
}, z.core.$strip>;
export declare const ocrSchema: z.ZodObject<{
    imageBase64: z.ZodString;
    platform: z.ZodString;
}, z.core.$strip>;
export declare const syncSchema: z.ZodObject<{
    platformId: z.ZodString;
}, z.core.$strip>;
export declare const credentialZkProofSchema: z.ZodObject<{
    credentialId: z.ZodString;
}, z.core.$strip>;
export declare const incomeManualSchema: z.ZodObject<{
    amount: z.ZodNumber;
    date: z.ZodString;
    source: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const accessCreateSchema: z.ZodObject<{
    scope: z.ZodArray<z.ZodString>;
    duration: z.ZodNumber;
    lenderId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const attestationRequestSchema: z.ZodObject<{
    targetPhone: z.ZodString;
    relationship: z.ZodEnum<{
        COWORKER: "COWORKER";
        NEIGHBOR: "NEIGHBOR";
        COLLABORATED: "COLLABORATED";
    }>;
}, z.core.$strip>;
export declare const attestationSignSchema: z.ZodObject<{
    statement: z.ZodString;
}, z.core.$strip>;
export declare const lenderRegisterSchema: z.ZodObject<{
    orgDetails: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        licenseNumber: z.ZodString;
        gstNumber: z.ZodString;
    }, z.core.$strip>;
    contactDetails: z.ZodObject<{
        fullName: z.ZodString;
        designation: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const adminLenderActionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const whatsappJwtSchema: z.ZodObject<{
    jwt: z.ZodString;
}, z.core.$strip>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const tokenParamSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map