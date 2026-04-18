import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET as jwt.Secret;
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId }, secret, { expiresIn });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET as jwt.Secret;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId }, secret, { expiresIn });
};

export const hashAadhaar = (aadhaar: string): string => {
  return createHash('sha256').update(aadhaar).digest('hex');
};

export const hashPan = (pan: string): string => {
  return createHash('sha256').update(pan).digest('hex');
};

export const hashOtp = (otp: string): string => {
  return createHash('sha256').update(otp).digest('hex');
};

export const encryptToken = (token: string): string => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
};

export const decryptToken = (encryptedToken: string): string => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};