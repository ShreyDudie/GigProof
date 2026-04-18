import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types/requests';
export declare const sendAadhaarOtp: (req: AuthenticatedRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const verifyAadhaarOtp: (req: AuthenticatedRequest, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const checkLiveness: (req: AuthenticatedRequest, res: Response<ApiResponse>) => Promise<void>;
export declare const getKycStatus: (req: AuthenticatedRequest, res: Response<ApiResponse>) => Promise<void>;
//# sourceMappingURL=kycController.d.ts.map