"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKycStatus = exports.checkLiveness = exports.verifyAadhaarOtp = exports.sendAadhaarOtp = void 0;
const index_1 = require("../index");
const auth_1 = require("../utils/auth");
const sendAadhaarOtp = async (req, res) => {
    try {
        const { aadhaarNumber } = req.body;
        const userId = req.user.id;
        // Mock UIDAI API call - in production, integrate with actual UIDAI eKYC
        console.log(`Sending OTP to Aadhaar: ${aadhaarNumber}`);
        // Store hashed Aadhaar
        const aadhaarHash = (0, auth_1.hashAadhaar)(aadhaarNumber);
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { aadhaarHash },
        });
        // Mock OTP generation
        const mockOtp = '123456';
        console.log(`Mock UIDAI OTP: ${mockOtp}`);
        res.json({
            success: true,
            data: { message: 'OTP sent to registered mobile number' },
        });
    }
    catch (error) {
        console.error('Send Aadhaar OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send Aadhaar OTP',
        });
    }
};
exports.sendAadhaarOtp = sendAadhaarOtp;
const verifyAadhaarOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;
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
        await index_1.prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: 'VERIFIED',
            },
        });
        // Create or update worker profile
        await index_1.prisma.workerProfile.upsert({
            where: { userId },
            update: {
                fullName: mockKycData.name,
            },
            create: {
                userId,
                fullName: mockKycData.name,
                preferredLang: 'en',
            },
        });
        res.json({
            success: true,
            data: {
                ...mockKycData,
                message: 'KYC verification successful',
            },
        });
    }
    catch (error) {
        console.error('Verify Aadhaar OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify Aadhaar OTP',
        });
    }
};
exports.verifyAadhaarOtp = verifyAadhaarOtp;
const checkLiveness = async (req, res) => {
    try {
        const { frameBase64 } = req.body;
        // Mock liveness detection - in production, use ML model
        const mockResult = {
            passed: true,
            confidence: 0.95,
        };
        res.json({
            success: true,
            data: mockResult,
        });
    }
    catch (error) {
        console.error('Liveness check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check liveness',
        });
    }
};
exports.checkLiveness = checkLiveness;
const getKycStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            select: { kycStatus: true, did: true },
        });
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get KYC status',
        });
    }
};
exports.getKycStatus = getKycStatus;
//# sourceMappingURL=kycController.js.map