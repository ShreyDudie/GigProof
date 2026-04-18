"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyValidators = exports.VerifyController = void 0;
const express_validator_1 = require("express-validator");
const supabase_1 = require("../database/supabase");
const helpers_1 = require("../database/helpers");
const behavioralDNA_1 = require("../services/behavioralDNA");
const fraudDetection_1 = require("../services/fraudDetection");
class VerifyController {
    static async verifyWorker(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
                return;
            }
            const { workerId, accessToken } = req.query;
            const tokenRecord = await (0, helpers_1.findAccessRequestByToken)(String(accessToken));
            const tokenMatchesWorker = tokenRecord && (tokenRecord.worker?.user_id === workerId || tokenRecord.worker?.id === workerId);
            if (!tokenMatchesWorker) {
                res.status(403).json({ success: false, error: 'Invalid or expired access token' });
                return;
            }
            let workerProfile = await (0, helpers_1.findWorkerProfile)(String(workerId));
            if (!workerProfile) {
                const { data, error } = await supabase_1.supabase
                    .from('worker_profiles')
                    .select('*')
                    .eq('id', String(workerId))
                    .single();
                if (error && error.code !== 'PGRST116')
                    throw error;
                workerProfile = data;
            }
            if (!workerProfile) {
                res.status(404).json({ success: false, error: 'Worker not found' });
                return;
            }
            const [credentials, incomeRecords, behavioralDNA, fraudAnalysis] = await Promise.all([
                (0, helpers_1.findCredentialsByWorker)(workerProfile.id),
                (0, helpers_1.findIncomeByWorker)(workerProfile.id),
                behavioralDNA_1.BehavioralDNAService.computeForWorker(workerProfile.user_id),
                fraudDetection_1.FraudDetectionService.analyzeAccessPatterns(workerProfile.id),
            ]);
            const grantedScope = tokenRecord.scope_granted || [];
            const verifiedData = {
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
                const safeIncome = (incomeRecords || []).filter((r) => r.verified);
                verifiedData.incomeData = {
                    records: safeIncome.map((rec) => ({
                        source: rec.source,
                        amount: rec.amount,
                        period: rec.period,
                        verified: rec.verified,
                    })),
                    summary: {
                        totalIncome: safeIncome.reduce((sum, rec) => sum + rec.amount, 0),
                        averageMonthly: safeIncome.length > 0
                            ? safeIncome.reduce((sum, rec) => sum + rec.amount, 0) / safeIncome.length
                            : 0,
                        sources: [...new Set(safeIncome.map((r) => r.source))],
                    },
                };
            }
            if (grantedScope.includes('credentials')) {
                verifiedData.credentials = (credentials || [])
                    .filter((cred) => !cred.revoked)
                    .map((cred) => ({
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
                await (0, helpers_1.createConsentLog)({
                    worker_id: workerProfile.user_id,
                    action: 'VIEWED',
                    actor_id: tokenRecord.lender.user_id,
                    scope: grantedScope,
                });
            }
            res.json({ success: true, data: verifiedData });
        }
        catch (error) {
            console.error('Verify worker error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async getLenderDashboard(req, res) {
        try {
            const lenderUserId = req.user?.id;
            if (!lenderUserId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const lenderProfile = await (0, helpers_1.findLenderProfile)(lenderUserId);
            if (!lenderProfile) {
                res.status(404).json({ success: false, error: 'Lender profile not found' });
                return;
            }
            const { data, error } = await supabase_1.supabase
                .from('access_requests')
                .select('*, worker:worker_profiles(*)')
                .eq('lender_id', lenderProfile.id)
                .order('created_at', { ascending: false })
                .limit(20);
            if (error)
                throw error;
            const accessRequests = data || [];
            const stats = {
                totalRequests: accessRequests.length,
                pendingRequests: accessRequests.filter((r) => r.status === 'PENDING').length,
                approvedRequests: accessRequests.filter((r) => r.status === 'APPROVED').length,
                activeTokens: accessRequests.filter((r) => r.status === 'APPROVED' && r.expires_at && new Date(r.expires_at) > new Date()).length,
            };
            const recentActivity = accessRequests.slice(0, 10).map((r) => ({
                id: r.id,
                workerName: r.worker?.full_name,
                purpose: r.purpose,
                status: r.status,
                createdAt: r.created_at,
                expiresAt: r.expires_at,
            }));
            res.json({ success: true, data: { profile: lenderProfile, stats, recentActivity } });
        }
        catch (error) {
            console.error('Get lender dashboard error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async registerLender(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
                return;
            }
            const { orgName, licenseNumber, phone } = req.body;
            let user = await (0, helpers_1.findUserByPhone)(phone);
            if (!user) {
                user = await (0, helpers_1.createUser)({ phone, role: 'LENDER' });
            }
            else if (user.role !== 'LENDER') {
                res.status(400).json({ success: false, error: 'User already exists with different role' });
                return;
            }
            const existingProfile = await (0, helpers_1.findLenderProfile)(user.id);
            if (existingProfile) {
                res.status(400).json({ success: false, error: 'Lender profile already exists' });
                return;
            }
            const lenderProfile = await (0, helpers_1.createLenderProfile)({
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
        }
        catch (error) {
            console.error('Register lender error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async approveLender(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
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
            const lenderProfile = await (0, helpers_1.findLenderProfileById)(lenderId);
            if (!lenderProfile) {
                res.status(404).json({ success: false, error: 'Lender profile not found' });
                return;
            }
            if (approved) {
                await (0, helpers_1.updateLenderProfile)(lenderId, { verified: true, verified_at: new Date() });
            }
            else {
                await (0, helpers_1.deleteLenderProfile)(lenderId);
            }
            res.json({ success: true, message: `Lender ${approved ? 'approved' : 'rejected'} successfully` });
        }
        catch (error) {
            console.error('Approve lender error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async getLenders(req, res) {
        try {
            if (req.user?.role !== 'ADMIN') {
                res.status(403).json({ success: false, error: 'Admin access required' });
                return;
            }
            const { data, error } = await supabase_1.supabase
                .from('lender_profiles')
                .select('*, user:users(phone)')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            const lenders = data || [];
            const enriched = await Promise.all(lenders.map(async (l) => ({
                ...l,
                _count: { accessRequests: await (0, helpers_1.countRecords)('access_requests', { lender_id: l.id }) },
            })));
            res.json({ success: true, data: enriched });
        }
        catch (error) {
            console.error('Get lenders error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
    static async getSystemHealth(req, res) {
        try {
            if (req.user?.role !== 'ADMIN') {
                res.status(403).json({ success: false, error: 'Admin access required' });
                return;
            }
            const [totalUsers, totalWorkers, totalLenders, totalCredentials, activeCredentials, totalAccessRequests, pendingLenders, pendingRequests, approvedRequests,] = await Promise.all([
                (0, helpers_1.countRecords)('users'),
                (0, helpers_1.countRecords)('worker_profiles'),
                (0, helpers_1.countRecords)('lender_profiles', { verified: true }),
                (0, helpers_1.countRecords)('credentials'),
                (0, helpers_1.countRecords)('credentials', { revoked: false }),
                (0, helpers_1.countRecords)('access_requests'),
                (0, helpers_1.countRecords)('lender_profiles', { verified: false }),
                (0, helpers_1.countRecords)('access_requests', { status: 'PENDING' }),
                (0, helpers_1.countRecords)('access_requests', { status: 'APPROVED' }),
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
        }
        catch (error) {
            console.error('Get system health error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}
exports.VerifyController = VerifyController;
exports.verifyValidators = {
    verifyWorker: [
        (0, express_validator_1.query)('workerId').isUUID().withMessage('Invalid worker ID'),
        (0, express_validator_1.query)('accessToken').isString().notEmpty().withMessage('Access token is required'),
    ],
    registerLender: [
        (0, express_validator_1.body)('orgName').isString().notEmpty().withMessage('Organization name is required'),
        (0, express_validator_1.body)('licenseNumber').isString().notEmpty().withMessage('License number is required'),
        (0, express_validator_1.body)('phone').isString().matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number'),
    ],
    approveLender: [
        (0, express_validator_1.param)('lenderId').isString().notEmpty().withMessage('Lender ID is required'),
        (0, express_validator_1.body)('approved').isBoolean().withMessage('Approved status is required'),
    ],
};
//# sourceMappingURL=verifyController.js.map