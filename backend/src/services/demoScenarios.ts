import {
  createAccessRequest,
  createConsentLog,
  createCredential,
  createIncomeRecord,
  createLenderProfile,
  createUser,
  createWorkerProfile,
  deleteFromTable,
  findLenderProfile,
  findUserByPhone,
  findWorkerProfile,
} from '../database/helpers';
import { BehavioralDNAService } from './behavioralDNA';
import { FraudDetectionService } from './fraudDetection';
import { OfflineCredentialService } from './offlineCredential';

export class DemoScenariosService {
  static async createWorkerDemoScenario(phone: string): Promise<{
    worker: any;
    credentials: any[];
    behavioralDNA: any;
    fraudAnalysis: any;
    offlineCredential: any;
  }> {
    let workerUser = await findUserByPhone(phone);
    if (!workerUser) {
      workerUser = await createUser({ phone, role: 'WORKER' });
    }

    let workerProfile = await findWorkerProfile(workerUser.id);
    if (!workerProfile) {
      workerProfile = await createWorkerProfile({
        user_id: workerUser.id,
        full_name: 'Rajesh Kumar Sharma',
        preferred_lang: 'hi',
      });
    }

    const incomeRecords = [
      { source: 'UBER', amount: 8500, period: '2024-01' },
      { source: 'UBER', amount: 9200, period: '2024-02' },
      { source: 'SWIGGY', amount: 7100, period: '2024-03' },
      { source: 'URBAN_COMPANY', amount: 11800, period: '2024-04' },
    ];

    for (const record of incomeRecords) {
      await createIncomeRecord({
        worker_id: workerProfile.id,
        source: record.source,
        amount: record.amount,
        currency: 'INR',
        period: record.period,
        verified: true,
      });
    }

    const credentials = await Promise.all([
      createCredential({
        worker_id: workerProfile.id,
        type: 'INCOME',
        tier: 'GOLD',
        issuer: 'GigProof',
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        vc_jwt: 'mock_vc_income',
        zk_proof_ready: false,
        metadata: {
          totalIncome: 36600,
          avgMonthly: 9150,
          verifiedSources: 3,
        },
      }),
      createCredential({
        worker_id: workerProfile.id,
        type: 'RATING',
        tier: 'SILVER',
        issuer: 'GigProof',
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        vc_jwt: 'mock_vc_rating',
        zk_proof_ready: false,
        metadata: {
          avgRating: 4.6,
          gigsCompleted: 154,
        },
      }),
    ]);

    const behavioralDNA = await BehavioralDNAService.computeForWorker(workerUser.id);
    const fraudAnalysis = await FraudDetectionService.analyzeAccessPatterns(workerProfile.id);
    const offlineCredential = await OfflineCredentialService.generateOfflineCard(workerProfile.id);

    return {
      worker: workerProfile,
      credentials,
      behavioralDNA,
      fraudAnalysis,
      offlineCredential,
    };
  }

  static async createLenderDemoScenario(phone: string, orgName: string): Promise<any> {
    let lenderUser = await findUserByPhone(phone);
    if (!lenderUser) {
      lenderUser = await createUser({ phone, role: 'LENDER' });
    }

    let lenderProfile = await findLenderProfile(lenderUser.id);
    if (!lenderProfile) {
      lenderProfile = await createLenderProfile({
        user_id: lenderUser.id,
        org_name: orgName,
        license_number: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        verified: true,
        verified_at: new Date(),
      });
    }

    return lenderProfile;
  }

  static async simulateAccessRequest(
    lenderProfileId: string,
    workerProfileId: string,
    purpose: string,
    scope: string[]
  ): Promise<any> {
    const accessRequest = await createAccessRequest({
      lender_id: lenderProfileId,
      worker_id: workerProfileId,
      purpose,
      scope_requested: scope,
      scope_granted: scope,
      status: 'APPROVED',
      token: `token_${Math.random().toString(36).substring(2, 16)}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return accessRequest;
  }

  static async generateLenderReport(lenderProfileId: string): Promise<{
    totalWorkersAccessed: number;
    averageScore: number;
    riskDistribution: Record<string, number>;
    recentActivity: any[];
  }> {
    const workerActivity = [
      { workerName: 'Rajesh Kumar', purpose: 'Loan underwriting', score: 82, timestamp: new Date() },
      { workerName: 'Sita Devi', purpose: 'Credit line review', score: 74, timestamp: new Date() },
    ];

    const scores = workerActivity.map((x) => x.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      totalWorkersAccessed: workerActivity.length,
      averageScore,
      riskDistribution: {
        low: scores.filter((s) => s >= 80).length,
        medium: scores.filter((s) => s >= 60 && s < 80).length,
        high: scores.filter((s) => s < 60).length,
      },
      recentActivity: workerActivity,
    };
  }

  static async resetDemoData(): Promise<void> {
    await deleteFromTable('consent_logs');
    await deleteFromTable('access_requests');
    await deleteFromTable('peer_attestations');
    await deleteFromTable('credentials');
    await deleteFromTable('income_records');
    await deleteFromTable('worker_profiles');
    await deleteFromTable('lender_profiles');
    await deleteFromTable('otp_verifications');
    await deleteFromTable('users');
  }
}
