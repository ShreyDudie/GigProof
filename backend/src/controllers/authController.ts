import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByPhone, createUser, upsertOtp, findOtpByPhone, updateOtp, findUserById } from '../database/helpers';
import { generateOtp, generateAccessToken, generateRefreshToken, hashOtp } from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, AuthRequest, OtpRequest, RefreshTokenRequest } from '../types/requests';

export const sendOtp = async (req: Request<{}, ApiResponse, AuthRequest>, res: Response<ApiResponse>) => {
  try {
    const { phone, role } = req.body;

    // Check if user exists
    let user = await findUserByPhone(phone);

    if (!user) {
      // Create new user
      user = await createUser({ phone, role });
    } else if (user.role !== role) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already registered with different role',
      });
    }

    // Generate and store OTP
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    await upsertOtp({
      phone,
      otp: hashedOtp,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      verified: false,
      attempts: 0,
    });

    // Mock SMS sending (in production, integrate with SMS provider)
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      data: { message: 'OTP sent successfully' },
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
    });
  }
};

export const verifyOtp = async (req: Request<{}, ApiResponse, OtpRequest>, res: Response<ApiResponse>) => {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await findOtpByPhone(phone);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found',
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP already verified',
      });
    }

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Too many attempts',
      });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired',
      });
    }

    const hashedOtp = hashOtp(otp);
    if (hashedOtp !== otpRecord.otp) {
      await updateOtp(phone, { attempts: otpRecord.attempts + 1 });
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
    }

    // Mark OTP as verified
    await updateOtp(phone, { verified: true });

    const user = otpRecord.users!;
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          kycStatus: user.kyc_status,
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
    });
  }
};

export const refreshToken = async (req: Request<{}, ApiResponse, RefreshTokenRequest>, res: Response<ApiResponse>) => {
  try {
    const { refreshToken: token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  // In a real implementation, you might want to blacklist the token
  // For now, just return success
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
};