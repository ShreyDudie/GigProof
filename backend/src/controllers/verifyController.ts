import { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../database/supabase';
import {
  createConsentLog,
  createLenderProfile,
  createUser,
  countRecords,
  deleteLenderProfile,
  findAccessRequestByToken,
  findCredentialsByWorker,
  findIncomeByWorker,
  findLenderProfile,
  findLenderProfileById,
  findUserByPhone,
  findWorkerProfile,
  updateLenderProfile,
} from '../database/helpers';
import { BehavioralDNAService } from '../services/behavioralDNA';
import { FraudDetectionService } from '../services/fraudDetection';
import { AuthenticatedRequest } from '../middleware/auth';

export class VerifyController {
  static async verifyWorker(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { workerId, accessToken } = req.query;
      const tokenRecord = await findAccessRequestByToken(String(accessToken));

      const tokenMatchesWorker = tokenRecord && (
        tokenRecord.worker?.user_id === workerId || tokenRecord.worker?.id === workerId
      );

      if (!tokenMatchesWorker) {
        res.status(403).json({ success: false, error: 'Invalid or expired access token' });
        return;
      }

      let workerProfile = await findWorkerProfile(String(workerId));
      if (!workerProfile) {
        const { data, error } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('id', String(workerId))
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        workerProfile = data;
      }

      if (!workerProfile) {
        res.status(404).json({ success: false, error: 'Worker not found' });
        return;
      }

      const [credentials, incomeRecords, behavioralDNA, fraudAnalysis] = await Promise.all([
        findCredentialsByWorker(workerProfile.id),
        findIncomeByWorker(workerProfile.id),
        BehavioralDNAService.computeForWorker(workerProfile.user_id),
        FraudDetectionService.analyzeAccessPatterns(workerProfile.id),
      ]);

      const grantedScope: string[] = tokenRecord.scope_granted || [];
      const verifiedData: any = {
        workerId: workerProfile.user_id,
        basicInfo: {
          fullName: workerProfile.full_name,
          verified: true,
        },
        accessGranted: grantedScope,
        accessExpires: tokenRecord.expires_at,
        verifiedAt: new Date().toISOString(),
      };

      if (grantedScope.includes('income_data')) {
        const safeIncome = (incomeRecords || []).filter((r: any) => r.verified);
        verifiedData.incomeData = {
          records: safeIncome.map((rec: any) => ({
            source: rec.source,
            amount: rec.amount,
            period: rec.period,
            verified: rec.verified,
          })),
          summary: {
            totalIncome: safeIncome.reduce((sum: number, rec: any) => sum + rec.amount, 0),
            averageMonthly: safeIncome.length > 0
              ? safeIncome.reduce((sum: number, rec: any) => sum + rec.amount, 0) / safeIncome.length
              : 0,
            sources: [...new Set(safeIncome.map((r: any) => r.source))],
          },
        };
      }

      if (grantedScope.includes('credentials')) {
        verifiedData.credentials = (credentials || [])
          .filter((cred: any) => !cred.revoked)
          .map((cred: any) => ({
            type: cred.type,
            tier: cred.tier,
            issuedAt: cred.issued_at,
            expiresAt: cred.expires_at,
            metadata: cred.metadata,
          }));
      }

      if (grantedScope.includes('behavioral_data')) {
        verifiedData.behavioralDNA = behavioralDNA;
      }

      verifiedData.riskAssessment = {
        score: fraudAnalysis.riskScore,
        flags: fraudAnalysis.flags,
        recommendations: fraudAnalysis.recommendations,
      };

      if (tokenRecord.lender?.user_id) {
        await createConsentLog({
          worker_id: workerProfile.user_id,
          action: 'VIEWED',
          actor_id: tokenRecord.lender.user_id,
          scope: grantedScope,
        });
      }

      res.json({ success: true, data: verifiedData });
    } catch (error) {
      console.error('Verify worker error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getLenderDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const lenderUserId = req.user?.id;
      if (!lenderUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const lenderProfile = await findLenderProfile(lenderUserId);
      if (!lenderProfile) {
        res.status(404).json({ success: false, error: 'Lender profile not found' });
        return;
      }

      const { data, error } = await supabase
        .from('access_requests')
        .select('*, worker:worker_profiles(*)')
        .eq('lender_id', lenderProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const accessRequests = data || [];

      const stats = {
        totalRequests: accessRequests.length,
        pendingRequests: accessRequests.filter((r: any) => r.status === 'PENDING').length,
        approvedRequests: accessRequests.filter((r: any) => r.status === 'APPROVED').length,
        activeTokens: accessRequests.filter((r: any) => r.status === 'APPROVED' && r.expires_at && new Date(r.expires_at) > new Date()).length,
      };

      const recentActivity = accessRequests.slice(0, 10).map((r: any) => ({
        id: r.id,
        workerName: r.worker?.full_name,
        purpose: r.purpose,
        status: r.status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      }));

      res.json({ success: true, data: { profile: lenderProfile, stats, recentActivity } });
    } catch (error) {
      console.error('Get lender dashboard error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async registerLender(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { orgName, licenseNumber, phone } = req.body;
      let user = await findUserByPhone(phone);

      if (!user) {
        user = await createUser({ phone, role: 'LENDER' });
      } else if (user.role !== 'LENDER') {
        res.status(400).json({ success: false, error: 'User already exists with different role' });
        return;
      }

      const existingProfile = await findLenderProfile(user.id);
      if (existingProfile) {
        res.status(400).json({ success: false, error: 'Lender profile already exists' });
        return;
      }

      const lenderProfile = await createLenderProfile({
        user_id: user.id,
        org_name: orgName,
        license_number: licenseNumber,
        verified: false,
      });

      res.status(201).json({
        success: true,
        message: 'Lender registration submitted for approval',
        data: lenderProfile,
      });
    } catch (error) {
      console.error('Register lender error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async approveLender(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const lenderId = String(req.params.lenderId);
      const { approved } = req.body;
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const lenderProfile = await findLenderProfileById(lenderId);
      if (!lenderProfile) {
        res.status(404).json({ success: false, error: 'Lender profile not found' });
        return;
      }

      if (approved) {
        await updateLenderProfile(lenderId, { verified: true, verified_at: new Date() });
      } else {
        await deleteLenderProfile(lenderId);
      }

      res.json({ success: true, message: `Lender ${approved ? 'approved' : 'rejected'} successfully` });
    } catch (error) {
      console.error('Approve lender error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getLenders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const { data, error } = await supabase
        .from('lender_profiles')
        .select('*, user:users(phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const lenders = data || [];

      const enriched = await Promise.all(
        lenders.map(async (l: any) => ({
          ...l,
          _count: { accessRequests: await countRecords('access_requests', { lender_id: l.id }) },
        }))
      );

      res.json({ success: true, data: enriched });
    } catch (error) {
      console.error('Get lenders error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const [
        totalUsers,
        totalWorkers,
        totalLenders,
        totalCredentials,
        activeCredentials,
        totalAccessRequests,
        pendingLenders,
        pendingRequests,
        approvedRequests,
      ] = await Promise.all([
        countRecords('users'),
        countRecords('worker_profiles'),
        countRecords('lender_profiles', { verified: true }),
        countRecords('credentials'),
        countRecords('credentials', { revoked: false }),
        countRecords('access_requests'),
        countRecords('lender_profiles', { verified: false }),
        countRecords('access_requests', { status: 'PENDING' }),
        countRecords('access_requests', { status: 'APPROVED' }),
      ]);

      res.json({
        success: true,
        data: {
          users: { total: totalUsers, workers: totalWorkers, lenders: totalLenders, pendingLenders },
          credentials: { total: totalCredentials, active: activeCredentials },
          access: { totalRequests: totalAccessRequests, pendingRequests, approvedRequests },
          system: { uptime: process.uptime(), timestamp: new Date().toISOString() },
        },
      });
    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export const verifyValidators = {
  verifyWorker: [
    query('workerId').isUUID().withMessage('Invalid worker ID'),
    query('accessToken').isString().notEmpty().withMessage('Access token is required'),
  ],
  registerLender: [
    body('orgName').isString().notEmpty().withMessage('Organization name is required'),
    body('licenseNumber').isString().notEmpty().withMessage('License number is required'),
    body('phone').isString().matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number'),
  ],
  approveLender: [
    param('lenderId').isString().notEmpty().withMessage('Lender ID is required'),
    body('approved').isBoolean().withMessage('Approved status is required'),
  ],
};