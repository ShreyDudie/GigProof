"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudDetectionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class FraudDetectionService {
    /**
     * Analyze access patterns for potential fraud
     */
    static async analyzeAccessPatterns(workerId) {
        const accessRequests = await prisma.accessRequest.findMany({
            where: { workerId },
            orderBy: { createdAt: 'desc' },
            take: 50, // Last 50 requests
        });
        const flags = [];
        const recommendations = [];
        let riskScore = 0;
        // Check for rapid successive requests
        const recentRequests = accessRequests.filter(req => new Date(req.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
        );
        if (recentRequests.length > 10) {
            flags.push('HIGH_FREQUENCY_REQUESTS');
            riskScore += 30;
            recommendations.push('Limit access requests to 5 per day');
        }
        // Check for requests from same lender repeatedly
        const lenderCounts = recentRequests.reduce((acc, req) => {
            acc[req.lenderId] = (acc[req.lenderId] || 0) + 1;
            return acc;
        }, {});
        const maxRequestsFromLender = Math.max(...Object.values(lenderCounts));
        if (maxRequestsFromLender > 5) {
            flags.push('REPEATED_LENDER_REQUESTS');
            riskScore += 20;
            recommendations.push('Review consent for repeated lender access');
        }
        // Check for broad scope requests
        const broadScopeRequests = accessRequests.filter(req => req.scopeRequested.length > 3);
        if (broadScopeRequests.length > recentRequests.length * 0.3) {
            flags.push('BROAD_SCOPE_REQUESTS');
            riskScore += 25;
            recommendations.push('Require specific scope justification');
        }
        // Check for denied requests pattern
        const deniedRequests = accessRequests.filter(req => req.status === 'DENIED');
        if (deniedRequests.length > accessRequests.length * 0.5) {
            flags.push('HIGH_DENIAL_RATE');
            riskScore += 15;
            recommendations.push('Review profile completeness and data quality');
        }
        // Behavioral analysis
        const behavioralDNA = await this.getBehavioralDNA(workerId);
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
        // Cap risk score at 100
        riskScore = Math.min(riskScore, 100);
        return {
            riskScore,
            flags,
            recommendations,
        };
    }
    /**
     * Detect suspicious credential sharing patterns
     */
    static async detectCredentialAbuse(workerId) {
        const credentials = await prisma.credential.findMany({
            where: { workerId },
        });
        const reasons = [];
        // Check for recently issued credentials being revoked quickly
        const recentCredentials = credentials.filter(cred => new Date(cred.issuedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
        );
        const revokedRecent = recentCredentials.filter(cred => cred.revoked);
        if (revokedRecent.length > recentCredentials.length * 0.2) {
            reasons.push('High rate of recent credential revocations');
        }
        // Check for credentials shared with unverified lenders
        const accessRequests = await prisma.accessRequest.findMany({
            where: { workerId, status: 'APPROVED' },
            include: { lender: true },
        });
        const unverifiedLenders = accessRequests.filter(req => !req.lender.verified);
        if (unverifiedLenders.length > accessRequests.length * 0.3) {
            reasons.push('Credentials shared with unverified lenders');
        }
        // Check for unusual access patterns (e.g., accessing at odd hours)
        const oddHourAccess = accessRequests.filter(req => {
            const hour = new Date(req.createdAt).getHours();
            return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
        });
        if (oddHourAccess.length > accessRequests.length * 0.1) {
            reasons.push('Unusual access timing patterns');
        }
        return {
            suspicious: reasons.length > 0,
            reasons,
        };
    }
    /**
     * Monitor for data tampering attempts
     */
    static async detectDataTampering(workerId) {
        const indicators = [];
        // Check income records for anomalies
        const incomeRecords = await prisma.incomeRecord.findMany({
            where: { workerId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        // Detect sudden spikes in income
        for (let i = 1; i < incomeRecords.length; i++) {
            const current = incomeRecords[i];
            const previous = incomeRecords[i - 1];
            if (current.amount > previous.amount * 2) {
                indicators.push(`Sudden income spike: ${previous.amount} → ${current.amount}`);
            }
        }
        // Check for duplicate transaction references
        const transactionRefs = incomeRecords
            .map(rec => rec.transactionRef)
            .filter(ref => ref !== null);
        const uniqueRefs = new Set(transactionRefs);
        if (uniqueRefs.size < transactionRefs.length * 0.9) {
            indicators.push('Duplicate transaction references detected');
        }
        // Check peer attestations for suspicious patterns
        const attestations = await prisma.peerAttestation.findMany({
            where: { subjectId: workerId },
        });
        // Detect self-attestations (same phone number)
        const selfAttestations = attestations.filter(att => {
            // In a real implementation, we'd check if attester phone matches worker phone
            return false; // Mock - assume no self-attestations
        });
        if (selfAttestations.length > 0) {
            indicators.push('Potential self-attestation detected');
        }
        return {
            tampered: indicators.length > 0,
            indicators,
        };
    }
    /**
     * Get behavioral DNA for fraud analysis
     */
    static async getBehavioralDNA(workerId) {
        const incomeRecords = await prisma.incomeRecord.findMany({
            where: { workerId },
            orderBy: { createdAt: 'asc' },
        });
        if (incomeRecords.length === 0) {
            return {
                consistencyIndex: 0,
                reputationMomentum: 0,
            };
        }
        // Calculate consistency index (coefficient of variation)
        const amounts = incomeRecords.map(rec => rec.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const consistencyIndex = mean > 0 ? 1 - (stdDev / mean) : 0;
        // Calculate reputation momentum (trend in recent performance)
        const recentRecords = incomeRecords.slice(-10); // Last 10 records
        if (recentRecords.length < 2) {
            return { consistencyIndex, reputationMomentum: 0 };
        }
        const recentAmounts = recentRecords.map(rec => rec.amount);
        const recentMean = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length;
        const earlierRecords = incomeRecords.slice(-20, -10); // Previous 10 records
        const earlierMean = earlierRecords.length > 0
            ? earlierRecords.map(rec => rec.amount).reduce((a, b) => a + b, 0) / earlierRecords.length
            : mean;
        const reputationMomentum = earlierMean > 0 ? (recentMean - earlierMean) / earlierMean : 0;
        return {
            consistencyIndex: Math.max(0, Math.min(1, consistencyIndex)),
            reputationMomentum,
        };
    }
    /**
     * Generate fraud alert for admin review
     */
    static async generateFraudAlert(workerId, alertType, details) {
        // In a real implementation, this would create an alert record
        // and potentially send notifications to admins
        console.log(`Fraud Alert Generated: ${alertType} for worker ${workerId}`, details);
        // Log to consent logs for audit trail
        await prisma.consentLog.create({
            data: {
                workerId,
                action: 'VIEWED', // Using existing action type
                actorId: 'system', // System-generated alert
                scope: ['fraud_detection'],
                timestamp: new Date(),
            },
        });
    }
}
exports.FraudDetectionService = FraudDetectionService;
//# sourceMappingURL=fraudDetection.js.map