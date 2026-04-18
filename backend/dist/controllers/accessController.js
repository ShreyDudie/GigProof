"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessValidators = exports.AccessController = void 0;
const express_validator_1 = require("express-validator");
const supabase_1 = require("../database/supabase");
const helpers_1 = require("../database/helpers");
class AccessController {
    static getParamId(value) {
        return Array.isArray(value) ? value[0] : value || '';
    }
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
            const lenderProfile = await (0, helpers_1.findLenderProfile)(lenderId);
            if (!lenderProfile || !lenderProfile.verified) {
                res.status(403).json({
                    success: false,
                    error: 'Lender profile not verified',
                });
                return;
            }
            const { data: existingRequest, error: existingError } = await supabase_1.supabase
                .from('access_requests')
                .select('*')
                .eq('lender_id', lenderId)
                .eq('worker_id', workerId)
                .eq('status', 'PENDING')
                .single();
            if (existingError && existingError.code !== 'PGRST116')
                throw existingError;
            if (existingRequest) {
                res.status(400).json({
                    success: false,
                    error: 'Pending access request already exists',
                });
                return;
            }
            const accessRequest = await (0, helpers_1.createAccessRequest)({
                lender_id: lenderId,
                worker_id: workerId,
                purpose,
                scope_requested: scope,
                status: 'PENDING',
                created_at: new Date(),
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
            const filter = {};
            if (userRole === 'WORKER')
                filter.worker_id = userId;
            else if (userRole === 'LENDER')
                filter.lender_id = userId;
            else if (userRole === 'ADMIN') {
                if (status)
                    filter.status = status;
            }
            else {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            if (status && userRole !== 'ADMIN')
                filter.status = status;
            const requests = await (userRole === 'LENDER'
                ? (0, helpers_1.findAccessRequestsByLender)(userId)
                : userRole === 'WORKER'
                    ? (0, helpers_1.findAccessRequestsByWorker)(userId)
                    : supabase_1.supabase
                        .from('access_requests')
                        .select(`*, worker:worker_profiles(*, user:users(*)), lender:lender_profiles(*)`)
                        .order('created_at', { ascending: false })
                        .then(({ data }) => data || []));
            const accessRequests = Array.isArray(requests)
                ? requests.filter((reqItem) => !filter.status || reqItem.status === filter.status)
                : [];
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
            const requestId = this.getParamId(req.params.requestId);
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
            const accessRequest = await (0, helpers_1.findAccessRequestById)(requestId);
            if (!accessRequest) {
                res.status(404).json({
                    success: false,
                    error: 'Access request not found',
                });
                return;
            }
            if (userRole !== 'ADMIN' && accessRequest.worker_id !== userId) {
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
                updateData.scope_granted = scopeGranted || accessRequest.scope_requested;
                updateData.token = `access_token_${Math.random().toString(36).substring(2, 16)}`;
                updateData.expires_at = new Date(Date.now() + (tokenExpiryHours || 24) * 60 * 60 * 1000);
            }
            const updatedRequest = await (0, helpers_1.updateAccessRequest)(requestId, updateData);
            await (0, helpers_1.createConsentLog)({
                worker_id: accessRequest.worker_id,
                action: action === 'approve' ? 'GRANTED' : 'REVOKED',
                actor_id: userId,
                scope: updateData.scope_granted || [],
                timestamp: new Date(),
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
            const requestId = this.getParamId(req.params.requestId);
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const accessRequest = await (0, helpers_1.findAccessRequestById)(requestId);
            if (!accessRequest) {
                res.status(404).json({
                    success: false,
                    error: 'Access request not found',
                });
                return;
            }
            if (userRole !== 'ADMIN' && accessRequest.worker_id !== userId && accessRequest.lender_id !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            const updatedRequest = await (0, helpers_1.updateAccessRequest)(requestId, {
                status: 'EXPIRED',
                token: null,
                expires_at: new Date(),
            });
            await (0, helpers_1.createConsentLog)({
                worker_id: accessRequest.worker_id,
                action: 'REVOKED',
                actor_id: userId,
                scope: accessRequest.scope_granted,
                timestamp: new Date(),
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
            const filter = {};
            if (userRole === 'WORKER')
                filter.worker_id = userId;
            else if (userRole === 'LENDER')
                filter.actor_id = userId;
            else if (userRole === 'ADMIN') {
                if (workerId)
                    filter.worker_id = workerId;
            }
            else {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            if (startDate)
                filter.startDate = startDate;
            if (endDate)
                filter.endDate = endDate;
            const consentLogs = await (0, helpers_1.findConsentLogs)(filter);
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
            const accessRequest = await (0, helpers_1.findAccessRequestByToken)(token);
            if (!accessRequest) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired access token',
                });
                return;
            }
            const grantedData = {
                workerId: accessRequest.worker_id,
                grantedScopes: accessRequest.scope_granted,
                expiresAt: accessRequest.expires_at,
            };
            if (accessRequest.scope_granted.includes('basic_info')) {
                grantedData.basicInfo = {
                    fullName: accessRequest.worker.fullName,
                    verified: accessRequest.worker.kycStatus === 'VERIFIED',
                };
            }
            if (accessRequest.scope_granted.includes('income_data')) {
                grantedData.incomeData = (accessRequest.worker.income_records || [])
                    .filter((rec) => rec.verified)
                    .map((rec) => ({
                    source: rec.source,
                    amount: rec.amount,
                    period: rec.period,
                    verified: rec.verified,
                }));
            }
            if (accessRequest.scope_granted.includes('credentials')) {
                grantedData.credentials = (accessRequest.worker.credentials || [])
                    .filter((cred) => accessRequest.scope_granted.includes(cred.type.toLowerCase()))
                    .map((cred) => ({
                    type: cred.type,
                    tier: cred.tier,
                    issuedAt: cred.issued_at,
                    expiresAt: cred.expires_at,
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