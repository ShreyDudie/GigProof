import {
  createConsentLog,
  findAccessRequestsByWorker,
  findAttestationsBySubject,
  findCredentialsByWorker,
  findIncomeByWorker,
} from '../database/helpers';

export class FraudDetectionService {
  static async analyzeAccessPatterns(workerProfileId: string): Promise<{
    riskScore: number;
    flags: string[];
    recommendations: string[];
  }> {
    const accessRequests = (await findAccessRequestsByWorker(workerProfileId)) || [];
    const flags: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    const recentRequests = accessRequests.filter(
      (req: any) => new Date(req.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    if (recentRequests.length > 10) {
      flags.push('HIGH_FREQUENCY_REQUESTS');
      riskScore += 30;
      recommendations.push('Limit access requests to 5 per day');
    }

    const lenderCounts = recentRequests.reduce((acc: Record<string, number>, req: any) => {
      acc[req.lender_id] = (acc[req.lender_id] || 0) + 1;
      return acc;
    }, {});

    const lenderBuckets = Object.values(lenderCounts) as number[];
    const maxRequestsFromLender = lenderBuckets.length > 0 ? Math.max(...lenderBuckets) : 0;
    if (maxRequestsFromLender > 5) {
      flags.push('REPEATED_LENDER_REQUESTS');
      riskScore += 20;
      recommendations.push('Review consent for repeated lender access');
    }

    const broadScopeRequests = accessRequests.filter((req: any) => (req.scope_requested || []).length > 3);
    if (recentRequests.length > 0 && broadScopeRequests.length > recentRequests.length * 0.3) {
      flags.push('BROAD_SCOPE_REQUESTS');
      riskScore += 25;
      recommendations.push('Require specific scope justification');
    }

    const deniedRequests = accessRequests.filter((req: any) => req.status === 'DENIED');
    if (accessRequests.length > 0 && deniedRequests.length > accessRequests.length * 0.5) {
      flags.push('HIGH_DENIAL_RATE');
      riskScore += 15;
      recommendations.push('Review profile completeness and data quality');
    }

    const behavioralDNA = await this.getBehavioralDNA(workerProfileId);
    if (behavioralDNA.consistencyIndex < 0.6) {
      flags.push('LOW_CONSISTENCY_INDEX');
      riskScore += 20;
      recommendations.push('Improve income consistency across platforms');
    }

    if (behavioralDNA.reputationMomentum < 0) {
      flags.push('DECLINING_REPUTATION');
      riskScore += 25;
      recommendations.push('Address negative feedback and improve service quality');
    }

    riskScore = Math.min(riskScore, 100);

    return { riskScore, flags, recommendations };
  }

  static async detectCredentialAbuse(workerProfileId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const [credentials, accessRequests] = await Promise.all([
      findCredentialsByWorker(workerProfileId),
      findAccessRequestsByWorker(workerProfileId),
    ]);

    const reasons: string[] = [];
    const safeCredentials = credentials || [];
    const safeAccessRequests = accessRequests || [];

    const recentCredentials = safeCredentials.filter(
      (cred: any) => new Date(cred.issued_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const revokedRecent = recentCredentials.filter((cred: any) => cred.revoked);
    if (recentCredentials.length > 0 && revokedRecent.length > recentCredentials.length * 0.2) {
      reasons.push('High rate of recent credential revocations');
    }

    const unverifiedLenders = safeAccessRequests.filter((req: any) => !req.lender?.verified);
    if (safeAccessRequests.length > 0 && unverifiedLenders.length > safeAccessRequests.length * 0.3) {
      reasons.push('Credentials shared with unverified lenders');
    }

    const oddHourAccess = safeAccessRequests.filter((req: any) => {
      const hour = new Date(req.created_at).getHours();
      return hour < 6 || hour > 22;
    });

    if (safeAccessRequests.length > 0 && oddHourAccess.length > safeAccessRequests.length * 0.1) {
      reasons.push('Unusual access timing patterns');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  static async detectDataTampering(workerProfileId: string): Promise<{
    tampered: boolean;
    indicators: string[];
  }> {
    const indicators: string[] = [];

    const [incomeRecords, attestations] = await Promise.all([
      findIncomeByWorker(workerProfileId),
      findAttestationsBySubject(workerProfileId),
    ]);

    const sortedIncomeRecords = (incomeRecords || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 1; i < sortedIncomeRecords.length; i++) {
      const current = sortedIncomeRecords[i];
      const previous = sortedIncomeRecords[i - 1];

      if (previous.amount > 0 && current.amount > previous.amount * 2) {
        indicators.push(`Sudden income spike: ${previous.amount} -> ${current.amount}`);
      }
    }

    const transactionRefs = sortedIncomeRecords
      .map((rec: any) => rec.transaction_ref)
      .filter((ref: string | null) => ref !== null);

    const uniqueRefs = new Set(transactionRefs);
    if (transactionRefs.length > 0 && uniqueRefs.size < transactionRefs.length * 0.9) {
      indicators.push('Duplicate transaction references detected');
    }

    const selfAttestations = (attestations || []).filter((att: any) => att.attester_id === att.subject_id);
    if (selfAttestations.length > 0) {
      indicators.push('Potential self-attestation detected');
    }

    return {
      tampered: indicators.length > 0,
      indicators,
    };
  }

  private static async getBehavioralDNA(workerProfileId: string) {
    const incomeRecords = ((await findIncomeByWorker(workerProfileId)) || []).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (incomeRecords.length === 0) {
      return { consistencyIndex: 0, reputationMomentum: 0 };
    }

    const amounts = incomeRecords.map((rec: any) => rec.amount);
    const mean = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const consistencyIndex = mean > 0 ? 1 - (stdDev / mean) : 0;

    const recentRecords = incomeRecords.slice(-10);
    if (recentRecords.length < 2) {
      return { consistencyIndex, reputationMomentum: 0 };
    }

    const recentMean = recentRecords.reduce((sum: number, rec: any) => sum + rec.amount, 0) / recentRecords.length;
    const earlierRecords = incomeRecords.slice(-20, -10);
    const earlierMean = earlierRecords.length > 0
      ? earlierRecords.reduce((sum: number, rec: any) => sum + rec.amount, 0) / earlierRecords.length
      : mean;

    const reputationMomentum = earlierMean > 0 ? (recentMean - earlierMean) / earlierMean : 0;

    return {
      consistencyIndex: Math.max(0, Math.min(1, consistencyIndex)),
      reputationMomentum,
    };
  }

  static async generateFraudAlert(
    workerUserId: string,
    alertType: 'ACCESS_PATTERN' | 'CREDENTIAL_ABUSE' | 'DATA_TAMPERING',
    details: any
  ): Promise<void> {
    console.log(`Fraud Alert Generated: ${alertType} for worker ${workerUserId}`, details);

    await createConsentLog({
      worker_id: workerUserId,
      action: 'VIEWED',
      actor_id: workerUserId,
      scope: ['fraud_detection'],
      timestamp: new Date(),
    });
  }
}
