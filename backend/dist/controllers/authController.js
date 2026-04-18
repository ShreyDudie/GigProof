"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.verifyOtp = exports.sendOtp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../database/helpers");
const auth_1 = require("../utils/auth");
const sendOtp = async (req, res) => {
    try {
        const { phone, role } = req.body;
        // Check if user exists
        let user = await (0, helpers_1.findUserByPhone)(phone);
        if (!user) {
            // Create new user
            user = await (0, helpers_1.createUser)({ phone, role });
        }
        else if (user.role !== role) {
            return res.status(400).json({
                success: false,
                error: 'Phone number already registered with different role',
            });
        }
        // Generate and store OTP
        const otp = (0, auth_1.generateOtp)();
        const hashedOtp = (0, auth_1.hashOtp)(otp);
        await (0, helpers_1.upsertOtp)({
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
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP',
        });
    }
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const otpRecord = await (0, helpers_1.findOtpByPhone)(phone);
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
        const hashedOtp = (0, auth_1.hashOtp)(otp);
        if (hashedOtp !== otpRecord.otp) {
            await (0, helpers_1.updateOtp)(phone, { attempts: otpRecord.attempts + 1 });
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP',
            });
        }
        // Mark OTP as verified
        await (0, helpers_1.updateOtp)(phone, { verified: true });
        const user = otpRecord.users;
        const accessToken = (0, auth_1.generateAccessToken)(user.id);
        const refreshToken = (0, auth_1.generateRefreshToken)(user.id);
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
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP',
        });
    }
};
exports.verifyOtp = verifyOtp;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await (0, helpers_1.findUserById)(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
            });
        }
        const newAccessToken = (0, auth_1.generateAccessToken)(user.id);
        const newRefreshToken = (0, auth_1.generateRefreshToken)(user.id);
        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
        });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    // In a real implementation, you might want to blacklist the token
    // For now, just return success
    res.json({
        success: true,
        data: { message: 'Logged out successfully' },
    });
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map