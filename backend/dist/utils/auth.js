"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = exports.decryptToken = exports.encryptToken = exports.hashOtp = exports.hashPan = exports.hashAadhaar = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const crypto_2 = require("crypto");
const generateAccessToken = (userId) => {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET;
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const hashAadhaar = (aadhaar) => {
    return (0, crypto_1.createHash)('sha256').update(aadhaar).digest('hex');
};
exports.hashAadhaar = hashAadhaar;
const hashPan = (pan) => {
    return (0, crypto_1.createHash)('sha256').update(pan).digest('hex');
};
exports.hashPan = hashPan;
const hashOtp = (otp) => {
    return (0, crypto_1.createHash)('sha256').update(otp).digest('hex');
};
exports.hashOtp = hashOtp;
const encryptToken = (token) => {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = (0, crypto_2.randomBytes)(16);
    const cipher = (0, crypto_2.createCipheriv)('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
};
exports.encryptToken = encryptToken;
const decryptToken = (encryptedToken) => {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    const decipher = (0, crypto_2.createDecipheriv)('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptToken = decryptToken;
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOtp = generateOtp;
//# sourceMappingURL=auth.js.map