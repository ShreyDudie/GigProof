"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudDetectionService = void 0;
const helpers_1 = require("../database/helpers");
class FraudDetectionService {
    static async analyzeAccessPatterns(workerProfileId) {
        const accessRequests = (await (0, helpers_1.findAccessRequestsByWorker)(workerProfileId)) || [];
        const flags = [];
        const recommendations = [];
        let riskScore = 0;
        const recentRequests = accessRequests.filter((req) => new Date(req.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000);
        if (recentRequests.length > 10) {
            flags.push('HIGH_FREQUENCY_REQUESTS');
            riskScore += 30;
            recommendations.push('Limit access requests to 5 per day');
        }
        const lenderCounts = recentRequests.reduce((acc, req) => {
            acc[req.lender_id] = (acc[req.lender_id] || 0) + 1;
            return acc;
        }, {});
        const lenderBuckets = Object.values(lenderCounts);
        const maxRequestsFromLender = lenderBuckets.length > 0 ? Math.max(...lenderBuckets) : 0;
        if (maxRequestsFromLender > 5) {
            flags.push('REPEATED_LENDER_REQUESTS');
            riskScore += 20;
            recommendations.push('Review consent for repeated lender access');
        }
        const broadScopeRequests = accessRequests.filter((req) => (req.scope_requested || []).length > 3);
        if (recentRequests.length > 0 && broadScopeRequests.length > recentRequests.length * 0.3) {
            flags.push('BROAD_SCOPE_REQUESTS');
            riskScore += 25;
            recommendations.push('Require specific scope justification');
        }
        const deniedRequests = accessRequests.filter((req) => req.status === 'DENIED');
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
    static async detectCredentialAbuse(workerProfileId) {
        const [credentials, accessRequests] = await Promise.all([
            (0, helpers_1.findCredentialsByWorker)(workerProfileId),
            (0, helpers_1.findAccessRequestsByWorker)(workerProfileId),
        ]);
        const reasons = [];
        const safeCredentials = credentials || [];
        const safeAccessRequests = accessRequests || [];
        const recentCredentials = safeCredentials.filter((cred) => new Date(cred.issued_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
        const revokedRecent = recentCredentials.filter((cred) => cred.revoked);
        if (recentCredentials.length > 0 && revokedRecent.length > recentCredentials.length * 0.2) {
            reasons.push('High rate of recent credential revocations');
        }
        const unverifiedLenders = safeAccessRequests.filter((req) => !req.lender?.verified);
        if (safeAccessRequests.length > 0 && unverifiedLenders.length > safeAccessRequests.length * 0.3) {
            reasons.push('Credentials shared with unverified lenders');
        }
        const oddHourAccess = safeAccessRequests.filter((req) => {
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
    static async detectDataTampering(workerProfileId) {
        const indicators = [];
        const [incomeRecords, attestations] = await Promise.all([
            (0, helpers_1.findIncomeByWorker)(workerProfileId),
            (0, helpers_1.findAttestationsBySubject)(workerProfileId),
        ]);
        const sortedIncomeRecords = (incomeRecords || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        for (let i = 1; i < sortedIncomeRecords.length; i++) {
            const current = sortedIncomeRecords[i];
            const previous = sortedIncomeRecords[i - 1];
            if (previous.amount > 0 && current.amount > previous.amount * 2) {
                indicators.push(`Sudden income spike: ${previous.amount} -> ${current.amount}`);
            }
        }
        const transactionRefs = sortedIncomeRecords
            .map((rec) => rec.transaction_ref)
            .filter((ref) => ref !== null);
        const uniqueRefs = new Set(transactionRefs);
        if (transactionRefs.length > 0 && uniqueRefs.size < transactionRefs.length * 0.9) {
            indicators.push('Duplicate transaction references detected');
        }
        const selfAttestations = (attestations || []).filter((att) => att.attester_id === att.subject_id);
        if (selfAttestations.length > 0) {
            indicators.push('Potential self-attestation detected');
        }
        return {
            tampered: indicators.length > 0,
            indicators,
        };
    }
    static async getBehavioralDNA(workerProfileId) {
        const incomeRecords = ((await (0, helpers_1.findIncomeByWorker)(workerProfileId)) || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (incomeRecords.length === 0) {
            return { consistencyIndex: 0, reputationMomentum: 0 };
        }
        const amounts = incomeRecords.map((rec) => rec.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const consistencyIndex = mean > 0 ? 1 - (stdDev / mean) : 0;
        const recentRecords = incomeRecords.slice(-10);
        if (recentRecords.length < 2) {
            return { consistencyIndex, reputationMomentum: 0 };
        }
        const recentMean = recentRecords.reduce((sum, rec) => sum + rec.amount, 0) / recentRecords.length;
        const earlierRecords = incomeRecords.slice(-20, -10);
        const earlierMean = earlierRecords.length > 0
            ? earlierRecords.reduce((sum, rec) => sum + rec.amount, 0) / earlierRecords.length
            : mean;
        const reputationMomentum = earlierMean > 0 ? (recentMean - earlierMean) / earlierMean : 0;
        return {
            consistencyIndex: Math.max(0, Math.min(1, consistencyIndex)),
            reputationMomentum,
        };
    }
    static async generateFraudAlert(workerUserId, alertType, details) {
        console.log(`Fraud Alert Generated: ${alertType} for worker ${workerUserId}`, details);
        await (0, helpers_1.createConsentLog)({
            worker_id: workerUserId,
            action: 'VIEWED',
            actor_id: workerUserId,
            scope: ['fraud_detection'],
            timestamp: new Date(),
        });
    }
}
exports.FraudDetectionService = FraudDetectionService;
//# sourceMappingURL=fraudDetection.js.map