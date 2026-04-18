export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthRequest {
  phone: string;
  role: 'WORKER' | 'LENDER' | 'ADMIN';
}

export interface OtpRequest {
  phone: string;
  otp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface KycAadhaarRequest {
  aadhaarNumber: string;
}

export interface KycAadhaarVerifyRequest {
  otp: string;
}

export interface LivenessRequest {
  frameBase64: string;
}

export interface PlatformConnectRequest {
  platform: string;
  authCode: string;
}

export interface OcrRequest {
  imageBase64: string;
  platform: string;
}

export interface SyncRequest {
  platformId: string;
}

export interface CredentialZkProofRequest {
  credentialId: string;
}

export interface IncomeManualRequest {
  amount: number;
  date: string;
  source: string;
  notes?: string;
}

export interface AccessCreateRequest {
  scope: string[];
  duration: number; // hours
  lenderId?: string;
}

export interface AttestationRequest {
  targetPhone: string;
  relationship: 'COWORKER' | 'NEIGHBOR' | 'COLLABORATED';
}

export interface AttestationSignRequest {
  statement: string;
}

export interface LenderRegisterRequest {
  orgDetails: {
    name: string;
    type: string;
    licenseNumber: string;
    gstNumber: string;
  };
  contactDetails: {
    fullName: string;
    designation: string;
    email: string;
    phone: string;
  };
}

export interface AdminLenderApproveRequest {
  reason?: string;
}

export interface AdminLenderRejectRequest {
  reason: string;
}

export interface AdminCredentialRevokeRequest {
  reason: string;
}

export interface WhatsappJwtRequest {
  jwt: string;
}