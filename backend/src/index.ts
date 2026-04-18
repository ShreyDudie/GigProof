import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config';
import authRoutes from './routes/auth';
import kycRoutes from './routes/kyc';
import whatsappRoutes from './routes/whatsapp';
import platformRoutes from './routes/platforms';
import credentialRoutes from './routes/credentials';
import incomeRoutes from './routes/income';
import accessRoutes from './routes/access';
import attestationRoutes from './routes/attestations';
import verifyRoutes from './routes/verify';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/platforms', platformRoutes);
app.use('/api/v1/credentials', credentialRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/access', accessRoutes);
app.use('/api/v1/attestations', attestationRoutes);
app.use('/api/v1/verify', verifyRoutes);

// Routes will be added here

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});