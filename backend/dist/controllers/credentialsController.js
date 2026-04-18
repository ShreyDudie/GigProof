"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialValidators = exports.CredentialsController = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const zkProof_1 = require("../services/zkProof");
const behavioralDNA_1 = require("../services/behavioralDNA");
const prisma = new client_1.PrismaClient();
class CredentialsController {
    /**
     * Get worker's credentials
     */
    static async getCredentials(req, res) {
        try {
            const workerId = req.user?.id;
            const { type, tier } = req.query;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const where = { workerId };
            if (type) {
                where.type = type;
            }
            if (tier) {
                where.tier = tier;
            }
            const credentials = await prisma.credential.findMany({
                where,
                orderBy: { issuedAt: 'desc' },
            });
            res.json({
                success: true,
                data: credentials,
            });
        }
        catch (error) {
            console.error('Get credentials error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Issue a new credential
     */
    static async issueCredential(req, res) {
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
            const { type, tier } = req.body;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Generate credential data based on type
            const credentialData = await this.generateCredentialData(workerId, type);
            // Generate ZK proof
            const zkProof = await zkProof_1.ZKProofService.generateProof({
                credentialId: `temp_${Date.now()}`,
                workerId,
                attributes: credentialData.metadata,
            });
            // Create credential
            const credential = await prisma.credential.create({
                data: {
                    workerId,
                    type,
                    tier,
                    issuer: 'GigProof',
                    issuedAt: new Date(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    vcJwt: `mock_vc_jwt_${Date.now()}`,
                    zkProofReady: true,
                    metadata: {
                        ...credentialData.metadata,
                        zkProof,
                    },
                },
            });
            res.status(201).json({
                success: true,
                message: 'Credential issued successfully',
                data: credential,
            });
        }
        catch (error) {
            console.error('Issue credential error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Revoke a credential
     */
    static async revokeCredential(req, res) {
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
            const { credentialId } = req.params;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const credential = await prisma.credential.findFirst({
                where: {
                    id: credentialId,
                    workerId,
                },
            });
            if (!credential) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found',
                });
                return;
            }
            if (credential.revoked) {
                res.status(400).json({
                    success: false,
                    error: 'Credential already revoked',
                });
                return;
            }
            // Revoke credential
            const updatedCredential = await prisma.credential.update({
                where: { id: credentialId },
                data: {
                    revoked: true,
                    revokedAt: new Date(),
                },
            });
            res.json({
                success: true,
                message: 'Credential revoked successfully',
                data: updatedCredential,
            });
        }
        catch (error) {
            console.error('Revoke credential error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Share credential with lender (generate access token)
     */
    static async shareCredential(req, res) {
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
            const { credentialId, lenderId, purpose, scope } = req.body;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const credential = await prisma.credential.findFirst({
                where: {
                    id: credentialId,
                    workerId,
                    revoked: false,
                },
            });
            if (!credential) {
                res.status(404).json({
                    success: false,
                    error: 'Credential not found or revoked',
                });
                return;
            }
            // Create access request
            const accessRequest = await prisma.accessRequest.create({
                data: {
                    lenderId,
                    workerId,
                    purpose,
                    scopeRequested: scope,
                    scopeGranted: scope,
                    status: 'APPROVED', // Auto-approve for demo
                    token: `access_token_${Math.random().toString(36).substr(2, 16)}`,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });
            // Log consent
            await prisma.consentLog.create({
                data: {
                    workerId,
                    action: 'GRANTED',
                    actorId: lenderId,
                    scope,
                },
            });
            res.json({
                success: true,
                message: 'Credential shared successfully',
                data: {
                    accessToken: accessRequest.token,
                    expiresAt: accessRequest.expiresAt,
                    scope: accessRequest.scopeGranted,
                },
            });
        }
        catch (error) {
            console.error('Share credential error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Verify credential using ZK proof
     */
    static async verifyCredential(req, res) {
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
            const { proof, publicSignals } = req.body;
            // Verify ZK proof
            const isValid = await zkProof_1.ZKProofService.verifyProof(proof, publicSignals);
            if (!isValid) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid proof',
                });
                return;
            }
            res.json({
                success: true,
                message: 'Credential verified successfully',
                data: {
                    verified: true,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.error('Verify credential error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get credential statistics
     */
    static async getCredentialStats(req, res) {
        try {
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const credentials = await prisma.credential.findMany({
                where: { workerId },
            });
            const stats = {
                total: credentials.length,
                active: credentials.filter(c => !c.revoked).length,
                revoked: credentials.filter(c => c.revoked).length,
                byType: credentials.reduce((acc, c) => {
                    acc[c.type] = (acc[c.type] || 0) + 1;
                    return acc;
                }, {}),
                byTier: credentials.reduce((acc, c) => {
                    acc[c.tier] = (acc[c.tier] || 0) + 1;
                    return acc;
                }, {}),
            };
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Get credential stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Generate credential data based on type
     */
    static async generateCredentialData(workerId, type) {
        const worker = await prisma.workerProfile.findUnique({
            where: { userId: workerId },
            include: {
                incomeRecords: true,
                credentials: true,
            },
        });
        if (!worker) {
            throw new Error('Worker profile not found');
        }
        switch (type) {
            case 'INCOME':
                const totalIncome = worker.incomeRecords.reduce((sum, rec) => sum + rec.amount, 0);
                const averageMonthly = worker.incomeRecords.length > 0
                    ? totalIncome / worker.incomeRecords.length
                    : 0;
                return {
                    metadata: {
                        totalIncome,
                        averageMonthly,
                        platforms: [...new Set(worker.incomeRecords.map(r => r.source))],
                        consistencyScore: 0.85, // Mock
                        lastUpdated: new Date().toISOString(),
                    },
                };
            case 'RATING':
                return {
                    metadata: {
                        averageRating: 4.6,
                        totalRatings: 127,
                        platforms: ['Uber', 'Swiggy'],
                        fiveStarPercentage: 72,
                        lastUpdated: new Date().toISOString(),
                    },
                };
            case 'SKILL':
                return {
                    metadata: {
                        skills: worker.skills,
                        verifiedSkills: worker.skills.slice(0, 2), // Mock verification
                        certifications: ['Basic Training', 'Safety Course'],
                        lastUpdated: new Date().toISOString(),
                    },
                };
            case 'EMPLOYMENT':
                const behavioralDNA = await behavioralDNA_1.BehavioralDNAService.computeForWorker(workerId);
                return {
                    metadata: {
                        totalGigs: worker.incomeRecords.length,
                        activePlatforms: [...new Set(worker.incomeRecords.map(r => r.source))].length,
                        tenure: '18 months',
                        completionRate: 94,
                        behavioralScore: behavioralDNA.overallScore,
                        lastUpdated: new Date().toISOString(),
                    },
                };
            default:
                return {
                    metadata: {
                        type,
                        issuedAt: new Date().toISOString(),
                        customData: 'Mock credential data',
                    },
                };
        }
    }
}
exports.CredentialsController = CredentialsController;
// Validation rules
exports.credentialValidators = {
    issueCredential: [
        (0, express_validator_1.body)('type').isIn(['INCOME', 'RATING', 'SKILL', 'EMPLOYMENT', 'IDENTITY', 'PEER']).withMessage('Invalid credential type'),
        (0, express_validator_1.body)('tier').isIn(['GOLD', 'SILVER', 'BRONZE', 'UNVERIFIED']).withMessage('Invalid tier'),
    ],
    revokeCredential: [
        (0, express_validator_1.param)('credentialId').isUUID().withMessage('Invalid credential ID'),
    ],
    shareCredential: [
        (0, express_validator_1.body)('credentialId').isUUID().withMessage('Invalid credential ID'),
        (0, express_validator_1.body)('lenderId').isUUID().withMessage('Invalid lender ID'),
        (0, express_validator_1.body)('purpose').isString().notEmpty().withMessage('Purpose is required'),
        (0, express_validator_1.body)('scope').isArray().withMessage('Scope must be an array'),
    ],
    verifyCredential: [
        (0, express_validator_1.body)('proof').isObject().withMessage('Proof is required'),
        (0, express_validator_1.body)('publicSignals').isArray().withMessage('Public signals are required'),
    ],
};
//# sourceMappingURL=credentialsController.js.map