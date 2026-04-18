import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, AuthRequest, OtpRequest, RefreshTokenRequest } from '../types/requests';
export declare const sendOtp: (req: Request<{}, ApiResponse, AuthRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const verifyOtp: (req: Request<{}, ApiResponse, OtpRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const refreshToken: (req: Request<{}, ApiResponse, RefreshTokenRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const logout: (req: AuthenticatedRequest, res: Response<ApiResponse>) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map