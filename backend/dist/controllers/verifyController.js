"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyValidators = exports.VerifyController = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const behavioralDNA_1 = require("../services/behavioralDNA");
const fraudDetection_1 = require("../services/fraudDetection");
const prisma = new client_1.PrismaClient();
class VerifyController {
    /**
     * Verify worker data for lender
     */
    static async verifyWorker(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { workerId, accessToken } = req.query;
            const lenderId = req.user?.id;
            if (!lenderId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Validate access token
            const accessRequest = await prisma.accessRequest.findFirst({
                where: {
                    workerId: workerId,
                    lenderId,
                    token: accessToken,
                    status: 'APPROVED',
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!accessRequest) {
                res.status(403).json({
                    success: false,
                    error: 'Invalid or expired access token',
                });
                return;
            }
            // Get worker data
            const worker = await prisma.workerProfile.findUnique({
                where: { userId: workerId },
                include: {
                    credentials: {
                        where: { revoked: false },
                    },
                    incomeRecords: {
                        where: { verified: true },
                    },
                    user: {
                        select: {
                            phone: true,
                        },
                    },
                },
            });
            if (!worker) {
                res.status(404).json({
                    success: false,
                    error: 'Worker not found',
                });
                return;
            }
            // Compute behavioral DNA
            const behavioralDNA = await behavioralDNA_1.BehavioralDNAService.computeForWorker(worker.userId);
            // Get fraud analysis
            const fraudAnalysis = await fraudDetection_1.FraudDetectionService.analyzeAccessPatterns(worker.userId);
            // Filter data based on granted scope
            const verifiedData = {
                workerId: worker.userId,
                basicInfo: {
                    fullName: worker.fullName,
                    kycStatus: worker.kycStatus,
                    verified: worker.kycStatus === 'VERIFIED',
                },
                accessGranted: accessRequest.scopeGranted,
                accessExpires: accessRequest.expiresAt,
                verifiedAt: new Date().toISOString(),
            };
            // Add data based on scope
            if (accessRequest.scopeGranted.includes('income_data')) {
                verifiedData.incomeData = {
                    records: worker.incomeRecords.map(rec => ({
                        source: rec.source,
                        amount: rec.amount,
                        period: rec.period,
                        verified: rec.verified,
                    })),
                    summary: {
                        totalIncome: worker.incomeRecords.reduce((sum, rec) => sum + rec.amount, 0),
                        averageMonthly: worker.incomeRecords.length > 0
                            ? worker.incomeRecords.reduce((sum, rec) => sum + rec.amount, 0) / worker.incomeRecords.length
                            : 0,
                        sources: [...new Set(worker.incomeRecords.map(r => r.source))],
                    },
                };
            }
            if (accessRequest.scopeGranted.includes('credentials')) {
                verifiedData.credentials = worker.credentials
                    .filter(cred => accessRequest.scopeGranted.some(scope => scope.includes(cred.type.toLowerCase())))
                    .map(cred => ({
                    type: cred.type,
                    tier: cred.tier,
                    issuedAt: cred.issuedAt,
                    expiresAt: cred.expiresAt,
                    metadata: cred.metadata,
                }));
            }
            if (accessRequest.scopeGranted.includes('behavioral_data')) {
                verifiedData.behavioralDNA = behavioralDNA;
            }
            // Add risk assessment
            verifiedData.riskAssessment = {
                score: fraudAnalysis.riskScore,
                flags: fraudAnalysis.flags,
                recommendations: fraudAnalysis.recommendations,
            };
            // Log access
            await prisma.consentLog.create({
                data: {
                    workerId: worker.userId,
                    action: 'VIEWED',
                    actorId: lenderId,
                    scope: accessRequest.scopeGranted,
                },
            });
            res.json({
                success: true,
                data: verifiedData,
            });
        }
        catch (error) {
            console.error('Verify worker error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get lender dashboard data
     */
    static async getLenderDashboard(req, res) {
        try {
            const lenderId = req.user?.id;
            if (!lenderId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Get lender profile
            const lenderProfile = await prisma.lenderProfile.findUnique({
                where: { userId: lenderId },
            });
            if (!lenderProfile) {
                res.status(404).json({
                    success: false,
                    error: 'Lender profile not found',
                });
                return;
            }
            // Get access requests
            const accessRequests = await prisma.accessRequest.findMany({
                where: { lenderId },
                include: {
                    worker: {
                        select: {
                            id: true,
                            fullName: true,
                            kycStatus: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
            // Calculate statistics
            const stats = {
                totalRequests: accessRequests.length,
                pendingRequests: accessRequests.filter(r => r.status === 'PENDING').length,
                approvedRequests: accessRequests.filter(r => r.status === 'APPROVED').length,
                activeTokens: accessRequests.filter(r => r.status === 'APPROVED' && r.expiresAt > new Date()).length,
            };
            // Get recent activity
            const recentActivity = accessRequests.slice(0, 10).map(req => ({
                id: req.id,
                workerName: req.worker.fullName,
                purpose: req.purpose,
                status: req.status,
                createdAt: req.createdAt,
                expiresAt: req.expiresAt,
            }));
            res.json({
                success: true,
                data: {
                    profile: lenderProfile,
                    stats,
                    recentActivity,
                },
            });
        }
        catch (error) {
            console.error('Get lender dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Register new lender (admin approval required)
     */
    static async registerLender(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { orgName, licenseNumber, phone } = req.body;
            // Check if user exists
            let user = await prisma.user.findUnique({
                where: { phone },
            });
            if (!user) {
                // Create user if doesn't exist
                user = await prisma.user.create({
                    data: {
                        phone,
                        role: 'LENDER',
                    },
                });
            }
            else if (user.role !== 'LENDER') {
                res.status(400).json({
                    success: false,
                    error: 'User already exists with different role',
                });
                return;
            }
            // Check if lender profile already exists
            const existingProfile = await prisma.lenderProfile.findUnique({
                where: { userId: user.id },
            });
            if (existingProfile) {
                res.status(400).json({
                    success: false,
                    error: 'Lender profile already exists',
                });
                return;
            }
            // Create lender profile (unverified by default)
            const lenderProfile = await prisma.lenderProfile.create({
                data: {
                    userId: user.id,
                    orgName,
                    licenseNumber,
                    verified: false,
                },
            });
            res.status(201).json({
                success: true,
                message: 'Lender registration submitted for approval',
                data: lenderProfile,
            });
        }
        catch (error) {
            console.error('Register lender error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Admin: Approve or reject lender registration
     */
    static async approveLender(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { lenderId } = req.params;
            const { approved } = req.body;
            const adminId = req.user?.id;
            const userRole = req.user?.role;
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
                return;
            }
            const lenderProfile = await prisma.lenderProfile.findUnique({
                where: { id: lenderId },
            });
            if (!lenderProfile) {
                res.status(404).json({
                    success: false,
                    error: 'Lender profile not found',
                });
                return;
            }
            if (approved) {
                // Approve lender
                await prisma.lenderProfile.update({
                    where: { id: lenderId },
                    data: {
                        verified: true,
                        verifiedAt: new Date(),
                    },
                });
            }
            else {
                // Reject lender - delete profile
                await prisma.lenderProfile.delete({
                    where: { id: lenderId },
                });
            }
            res.json({
                success: true,
                message: `Lender ${approved ? 'approved' : 'rejected'} successfully`,
            });
        }
        catch (error) {
            console.error('Approve lender error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Admin: Get all lenders
     */
    static async getLenders(req, res) {
        try {
            const userRole = req.user?.role;
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
                return;
            }
            const lenders = await prisma.lenderProfile.findMany({
                include: {
                    user: {
                        select: {
                            phone: true,
                        },
                    },
                    _count: {
                        select: {
                            accessRequests: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json({
                success: true,
                data: lenders,
            });
        }
        catch (error) {
            console.error('Get lenders error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Admin: Get system health metrics
     */
    static async getSystemHealth(req, res) {
        try {
            const userRole = req.user?.role;
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
                return;
            }
            // Get various counts
            const [totalUsers, totalWorkers, totalLenders, totalCredentials, totalAccessRequests, pendingLenders,] = await Promise.all([
                prisma.user.count(),
                prisma.workerProfile.count(),
                prisma.lenderProfile.count({ where: { verified: true } }),
                prisma.credential.count(),
                prisma.accessRequest.count(),
                prisma.lenderProfile.count({ where: { verified: false } }),
            ]);
            const health = {
                users: {
                    total: totalUsers,
                    workers: totalWorkers,
                    lenders: totalLenders,
                    pendingLenders,
                },
                credentials: {
                    total: totalCredentials,
                    active: await prisma.credential.count({ where: { revoked: false } }),
                },
                access: {
                    totalRequests: totalAccessRequests,
                    pendingRequests: await prisma.accessRequest.count({ where: { status: 'PENDING' } }),
                    approvedRequests: await prisma.accessRequest.count({ where: { status: 'APPROVED' } }),
                },
                system: {
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                },
            };
            res.json({
                success: true,
                data: health,
            });
        }
        catch (error) {
            console.error('Get system health error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
}
exports.VerifyController = VerifyController;
// Validation rules
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