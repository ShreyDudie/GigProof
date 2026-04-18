import { Request, Response } from 'express';
import { updateUser, findWorkerProfile, createWorkerProfile, updateWorkerProfile } from '../database/helpers';
import { hashAadhaar } from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, KycAadhaarRequest, KycAadhaarVerifyRequest, LivenessRequest } from '../types/requests';

export const sendAadhaarOtp = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { aadhaarNumber }: KycAadhaarRequest = req.body;
    const userId = req.user!.id;

    // Mock UIDAI API call - in production, integrate with actual UIDAI eKYC
    console.log(`Sending OTP to Aadhaar: ${aadhaarNumber}`);

    // Store hashed Aadhaar
    const aadhaarHash = hashAadhaar(aadhaarNumber);

    await updateUser(userId, { aadhaar_hash: aadhaarHash });

    // Mock OTP generation
    const mockOtp = '123456';
    console.log(`Mock UIDAI OTP: ${mockOtp}`);

    res.json({
      success: true,
      data: { message: 'OTP sent to registered mobile number' },
    });
  } catch (error) {
    console.error('Send Aadhaar OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send Aadhaar OTP',
    });
  }
};

export const verifyAadhaarOtp = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { otp }: KycAadhaarVerifyRequest = req.body;
    const userId = req.user!.id;

    // Mock OTP verification - in production, verify with UIDAI
    if (otp !== '123456') {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
      });
    }

    // Mock UIDAI response
    const mockKycData = {
      name: 'John Doe',
      dob: '1990-01-01',
      gender: 'M',
      address: '123 Main St, Mumbai, Maharashtra',
      photoBase64: 'mock_photo_data',
    };

    // Update user KYC status
    await updateUser(userId, { kyc_status: 'VERIFIED' });

    // Create or update worker profile
    const existingProfile = await findWorkerProfile(userId);
    if (existingProfile) {
      await updateWorkerProfile(existingProfile.id, { full_name: mockKycData.name });
    } else {
      await createWorkerProfile({
        user_id: userId,
        full_name: mockKycData.name,
        preferred_lang: 'en',
      });
    }

    res.json({
      success: true,
      data: {
        ...mockKycData,
        message: 'KYC verification successful',
      },
    });
  } catch (error) {
    console.error('Verify Aadhaar OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify Aadhaar OTP',
    });
  }
};

export const checkLiveness = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { frameBase64 }: LivenessRequest = req.body;

    // Mock liveness detection - in production, use ML model
    const mockResult = {
      passed: true,
      confidence: 0.95,
    };

    res.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check liveness',
    });
  }
};

export const getKycStatus = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.id;

    const user = await findUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KYC status',
    });
  }
};