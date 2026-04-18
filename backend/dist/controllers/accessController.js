"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessValidators = exports.AccessController = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
class AccessController {
    /**
     * Request access to worker data
     */
    static async requestAccess(req, res) {
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
            const { workerId, purpose, scope } = req.body;
            const lenderId = req.user?.id;
            if (!lenderId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Check if lender profile exists and is verified
            const lenderProfile = await prisma.lenderProfile.findUnique({
                where: { userId: lenderId },
            });
            if (!lenderProfile || !lenderProfile.verified) {
                res.status(403).json({
                    success: false,
                    error: 'Lender profile not verified',
                });
                return;
            }
            // Check for existing pending request
            const existingRequest = await prisma.accessRequest.findFirst({
                where: {
                    lenderId,
                    workerId,
                    status: 'PENDING',
                },
            });
            if (existingRequest) {
                res.status(400).json({
                    success: false,
                    error: 'Pending access request already exists',
                });
                return;
            }
            const accessRequest = await prisma.accessRequest.create({
                data: {
                    lenderId,
                    workerId,
                    purpose,
                    scopeRequested: scope,
                    status: 'PENDING',
                },
            });
            res.status(201).json({
                success: true,
                message: 'Access request submitted successfully',
                data: accessRequest,
            });
        }
        catch (error) {
            console.error('Request access error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get access requests (for workers to view incoming requests)
     */
    static async getAccessRequests(req, res) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { status } = req.query;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            let where = {};
            if (userRole === 'WORKER') {
                where.workerId = userId;
            }
            else if (userRole === 'LENDER') {
                where.lenderId = userId;
            }
            else if (userRole === 'ADMIN') {
                // Admins can see all requests
            }
            else {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            if (status) {
                where.status = status;
            }
            const accessRequests = await prisma.accessRequest.findMany({
                where,
                include: {
                    worker: {
                        select: {
                            id: true,
                            fullName: true,
                            user: {
                                select: {
                                    phone: true,
                                },
                            },
                        },
                    },
                    lender: {
                        select: {
                            id: true,
                            orgName: true,
                            licenseNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json({
                success: true,
                data: accessRequests,
            });
        }
        catch (error) {
            console.error('Get access requests error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Approve or deny access request
     */
    static async respondToAccessRequest(req, res) {
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
            const { requestId } = req.params;
            const { action, scopeGranted, tokenExpiryHours } = req.body;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const accessRequest = await prisma.accessRequest.findUnique({
                where: { id: requestId },
                include: { worker: true },
            });
            if (!accessRequest) {
                res.status(404).json({
                    success: false,
                    error: 'Access request not found',
                });
                return;
            }
            // Only the worker or admin can respond to requests
            if (userRole !== 'ADMIN' && accessRequest.workerId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            if (accessRequest.status !== 'PENDING') {
                res.status(400).json({
                    success: false,
                    error: 'Request has already been processed',
                });
                return;
            }
            const updateData = {
                status: action === 'approve' ? 'APPROVED' : 'DENIED',
            };
            if (action === 'approve') {
                updateData.scopeGranted = scopeGranted || accessRequest.scopeRequested;
                updateData.token = `access_token_${Math.random().toString(36).substr(2, 16)}`;
                updateData.expiresAt = new Date(Date.now() + (tokenExpiryHours || 24) * 60 * 60 * 1000);
            }
            const updatedRequest = await prisma.accessRequest.update({
                where: { id: requestId },
                data: updateData,
            });
            // Log consent action
            await prisma.consentLog.create({
                data: {
                    workerId: accessRequest.workerId,
                    action: action === 'approve' ? 'GRANTED' : 'REVOKED',
                    actorId: userId,
                    scope: updateData.scopeGranted || [],
                },
            });
            res.json({
                success: true,
                message: `Access request ${action}d successfully`,
                data: updatedRequest,
            });
        }
        catch (error) {
            console.error('Respond to access request error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Revoke access token
     */
    static async revokeAccess(req, res) {
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
            const { requestId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const accessRequest = await prisma.accessRequest.findUnique({
                where: { id: requestId },
            });
            if (!accessRequest) {
                res.status(404).json({
                    success: false,
                    error: 'Access request not found',
                });
                return;
            }
            // Only the worker, lender, or admin can revoke access
            if (userRole !== 'ADMIN' &&
                accessRequest.workerId !== userId &&
                accessRequest.lenderId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            const updatedRequest = await prisma.accessRequest.update({
                where: { id: requestId },
                data: {
                    status: 'EXPIRED',
                    token: null,
                    expiresAt: new Date(),
                },
            });
            // Log consent revocation
            await prisma.consentLog.create({
                data: {
                    workerId: accessRequest.workerId,
                    action: 'REVOKED',
                    actorId: userId,
                    scope: accessRequest.scopeGranted,
                },
            });
            res.json({
                success: true,
                message: 'Access revoked successfully',
                data: updatedRequest,
            });
        }
        catch (error) {
            console.error('Revoke access error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get consent logs
     */
    static async getConsentLogs(req, res) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { workerId, startDate, endDate } = req.query;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            let where = {};
            if (userRole === 'WORKER') {
                where.workerId = userId;
            }
            else if (userRole === 'LENDER') {
                // Lenders can only see logs where they are the actor
                where.actorId = userId;
            }
            else if (userRole === 'ADMIN') {
                // Admins can see all logs, optionally filtered by worker
                if (workerId) {
                    where.workerId = workerId;
                }
            }
            else {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) {
                    where.timestamp.gte = new Date(startDate);
                }
                if (endDate) {
                    where.timestamp.lte = new Date(endDate);
                }
            }
            const consentLogs = await prisma.consentLog.findMany({
                where,
                include: {
                    worker: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                orderBy: { timestamp: 'desc' },
                take: 100, // Limit results
            });
            res.json({
                success: true,
                data: consentLogs,
            });
        }
        catch (error) {
            console.error('Get consent logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Validate access token and get granted data
     */
    static async validateAccessToken(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                res.status(400).json({
                    success: false,
                    error: 'Access token is required',
                });
                return;
            }
            const accessRequest = await prisma.accessRequest.findFirst({
                where: {
                    token: token,
                    status: 'APPROVED',
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    worker: {
                        include: {
                            credentials: {
                                where: { revoked: false },
                            },
                            incomeRecords: true,
                        },
                    },
                    lender: true,
                },
            });
            if (!accessRequest) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired access token',
                });
                return;
            }
            // Filter data based on granted scope
            const grantedData = {
                workerId: accessRequest.workerId,
                grantedScopes: accessRequest.scopeGranted,
                expiresAt: accessRequest.expiresAt,
            };
            if (accessRequest.scopeGranted.includes('basic_info')) {
                grantedData.basicInfo = {
                    fullName: accessRequest.worker.fullName,
                    verified: accessRequest.worker.kycStatus === 'VERIFIED',
                };
            }
            if (accessRequest.scopeGranted.includes('income_data')) {
                grantedData.incomeData = accessRequest.worker.incomeRecords
                    .filter(rec => rec.verified)
                    .map(rec => ({
                    source: rec.source,
                    amount: rec.amount,
                    period: rec.period,
                    verified: rec.verified,
                }));
            }
            if (accessRequest.scopeGranted.includes('credentials')) {
                grantedData.credentials = accessRequest.worker.credentials
                    .filter(cred => accessRequest.scopeGranted.includes(cred.type.toLowerCase()))
                    .map(cred => ({
                    type: cred.type,
                    tier: cred.tier,
                    issuedAt: cred.issuedAt,
                    expiresAt: cred.expiresAt,
                    metadata: cred.metadata,
                }));
            }
            res.json({
                success: true,
                data: grantedData,
            });
        }
        catch (error) {
            console.error('Validate access token error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
}
exports.AccessController = AccessController;
// Validation rules
exports.accessValidators = {
    requestAccess: [
        (0, express_validator_1.body)('workerId').isUUID().withMessage('Invalid worker ID'),
        (0, express_validator_1.body)('purpose').isString().notEmpty().withMessage('Purpose is required'),
        (0, express_validator_1.body)('scope').isArray().withMessage('Scope must be an array'),
    ],
    respondToAccessRequest: [
        (0, express_validator_1.param)('requestId').isUUID().withMessage('Invalid request ID'),
        (0, express_validator_1.body)('action').isIn(['approve', 'deny']).withMessage('Action must be approve or deny'),
        (0, express_validator_1.body)('scopeGranted').optional().isArray().withMessage('Granted scope must be an array'),
        (0, express_validator_1.body)('tokenExpiryHours').optional().isInt({ min: 1, max: 168 }).withMessage('Token expiry must be 1-168 hours'),
    ],
    revokeAccess: [
        (0, express_validator_1.param)('requestId').isUUID().withMessage('Invalid request ID'),
    ],
};
//# sourceMappingURL=accessController.js.map