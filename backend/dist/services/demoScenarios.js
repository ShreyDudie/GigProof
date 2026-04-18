"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoScenariosService = void 0;
const helpers_1 = require("../database/helpers");
const behavioralDNA_1 = require("./behavioralDNA");
const fraudDetection_1 = require("./fraudDetection");
const offlineCredential_1 = require("./offlineCredential");
class DemoScenariosService {
    static async createWorkerDemoScenario(phone) {
        let workerUser = await (0, helpers_1.findUserByPhone)(phone);
        if (!workerUser) {
            workerUser = await (0, helpers_1.createUser)({ phone, role: 'WORKER' });
        }
        let workerProfile = await (0, helpers_1.findWorkerProfile)(workerUser.id);
        if (!workerProfile) {
            workerProfile = await (0, helpers_1.createWorkerProfile)({
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
            await (0, helpers_1.createIncomeRecord)({
                worker_id: workerProfile.id,
                source: record.source,
                amount: record.amount,
                currency: 'INR',
                period: record.period,
                verified: true,
            });
        }
        const credentials = await Promise.all([
            (0, helpers_1.createCredential)({
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
            (0, helpers_1.createCredential)({
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
        const behavioralDNA = await behavioralDNA_1.BehavioralDNAService.computeForWorker(workerUser.id);
        const fraudAnalysis = await fraudDetection_1.FraudDetectionService.analyzeAccessPatterns(workerProfile.id);
        const offlineCredential = await offlineCredential_1.OfflineCredentialService.generateOfflineCard(workerProfile.id);
        return {
            worker: workerProfile,
            credentials,
            behavioralDNA,
            fraudAnalysis,
            offlineCredential,
        };
    }
    static async createLenderDemoScenario(phone, orgName) {
        let lenderUser = await (0, helpers_1.findUserByPhone)(phone);
        if (!lenderUser) {
            lenderUser = await (0, helpers_1.createUser)({ phone, role: 'LENDER' });
        }
        let lenderProfile = await (0, helpers_1.findLenderProfile)(lenderUser.id);
        if (!lenderProfile) {
            lenderProfile = await (0, helpers_1.createLenderProfile)({
                user_id: lenderUser.id,
                org_name: orgName,
                license_number: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                verified: true,
                verified_at: new Date(),
            });
        }
        return lenderProfile;
    }
    static async simulateAccessRequest(lenderProfileId, workerProfileId, purpose, scope) {
        const accessRequest = await (0, helpers_1.createAccessRequest)({
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
    static async generateLenderReport(lenderProfileId) {
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
    static async resetDemoData() {
        await (0, helpers_1.deleteFromTable)('consent_logs');
        await (0, helpers_1.deleteFromTable)('access_requests');
        await (0, helpers_1.deleteFromTable)('peer_attestations');
        await (0, helpers_1.deleteFromTable)('credentials');
        await (0, helpers_1.deleteFromTable)('income_records');
        await (0, helpers_1.deleteFromTable)('worker_profiles');
        await (0, helpers_1.deleteFromTable)('lender_profiles');
        await (0, helpers_1.deleteFromTable)('otp_verifications');
        await (0, helpers_1.deleteFromTable)('users');
    }
}
exports.DemoScenariosService = DemoScenariosService;
//# sourceMappingURL=demoScenarios.js.map