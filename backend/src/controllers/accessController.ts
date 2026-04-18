import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../database/supabase';
import {
  findLenderProfile,
  createAccessRequest,
  findAccessRequestById,
  updateAccessRequest,
  createConsentLog,
  findAccessRequestByToken,
  findAccessRequestsByLender,
  findAccessRequestsByWorker,
  findConsentLogs,
} from '../database/helpers';

export class AccessController {
  static async requestAccess(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const lenderProfile = await findLenderProfile(lenderId);
      if (!lenderProfile || !lenderProfile.verified) {
        res.status(403).json({
          success: false,
          error: 'Lender profile not verified',
        });
        return;
      }

      const { data: existingRequest, error: existingError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('lender_id', lenderId)
        .eq('worker_id', workerId)
        .eq('status', 'PENDING')
        .single();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existingRequest) {
        res.status(400).json({
          success: false,
          error: 'Pending access request already exists',
        });
        return;
      }

      const accessRequest = await createAccessRequest({
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
    } catch (error) {
      console.error('Request access error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async getAccessRequests(
    req: Request,
    res: Response
  ): Promise<void> {
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

      const filter: any = {};
      if (userRole === 'WORKER') filter.worker_id = userId;
      else if (userRole === 'LENDER') filter.lender_id = userId;
      else if (userRole === 'ADMIN') {
        if (status) filter.status = status;
      } else {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      if (status && userRole !== 'ADMIN') filter.status = status;

      const requests = await (userRole === 'LENDER'
        ? findAccessRequestsByLender(userId)
        : userRole === 'WORKER'
        ? findAccessRequestsByWorker(userId)
        : supabase
            .from('access_requests')
            .select(`*, worker:worker_profiles(*, user:users(*)), lender:lender_profiles(*)`)
            .order('created_at', { ascending: false })
            .then(({ data }) => data || []));

      const accessRequests = Array.isArray(requests)
        ? requests.filter((reqItem: any) => !filter.status || reqItem.status === filter.status)
        : [];

      res.json({
        success: true,
        data: accessRequests,
      });
    } catch (error) {
      console.error('Get access requests error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async respondToAccessRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const accessRequest = await findAccessRequestById(requestId);
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

      const updateData: any = {
        status: action === 'approve' ? 'APPROVED' : 'DENIED',
      };

      if (action === 'approve') {
        updateData.scope_granted = scopeGranted || accessRequest.scope_requested;
        updateData.token = `access_token_${Math.random().toString(36).substring(2, 16)}`;
        updateData.expires_at = new Date(Date.now() + (tokenExpiryHours || 24) * 60 * 60 * 1000);
      }

      const updatedRequest = await updateAccessRequest(requestId, updateData);

      await createConsentLog({
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
    } catch (error) {
      console.error('Respond to access request error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async revokeAccess(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const accessRequest = await findAccessRequestById(requestId);
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

      const updatedRequest = await updateAccessRequest(requestId, {
        status: 'EXPIRED',
        token: null,
        expires_at: new Date(),
      });

      await createConsentLog({
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
    } catch (error) {
      console.error('Revoke access error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async getConsentLogs(
    req: Request,
    res: Response
  ): Promise<void> {
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

      const filter: any = {};
      if (userRole === 'WORKER') filter.worker_id = userId;
      else if (userRole === 'LENDER') filter.actor_id = userId;
      else if (userRole === 'ADMIN') {
        if (workerId) filter.worker_id = workerId;
      } else {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;

      const consentLogs = await findConsentLogs(filter);

      res.json({
        success: true,
        data: consentLogs,
      });
    } catch (error) {
      console.error('Get consent logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async validateAccessToken(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { token } = req.query;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Access token is required',
        });
        return;
      }

      const accessRequest = await findAccessRequestByToken(token as string);
      if (!accessRequest) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired access token',
        });
        return;
      }

      const grantedData: any = {
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
          .filter((rec: any) => rec.verified)
          .map((rec: any) => ({
            source: rec.source,
            amount: rec.amount,
            period: rec.period,
            verified: rec.verified,
          }));
      }

      if (accessRequest.scope_granted.includes('credentials')) {
        grantedData.credentials = (accessRequest.worker.credentials || [])
          .filter((cred: any) => accessRequest.scope_granted.includes(cred.type.toLowerCase()))
          .map((cred: any) => ({
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
    } catch (error) {
      console.error('Validate access token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const accessValidators = {
  requestAccess: [
    body('workerId').isUUID().withMessage('Invalid worker ID'),
    body('purpose').isString().notEmpty().withMessage('Purpose is required'),
    body('scope').isArray().withMessage('Scope must be an array'),
  ],
  respondToAccessRequest: [
    param('requestId').isUUID().withMessage('Invalid request ID'),
    body('action').isIn(['approve', 'deny']).withMessage('Action must be approve or deny'),
    body('scopeGranted').optional().isArray().withMessage('Granted scope must be an array'),
    body('tokenExpiryHours').optional().isInt({ min: 1, max: 168 }).withMessage('Token expiry must be 1-168 hours'),
  ],
  revokeAccess: [
    param('requestId').isUUID().withMessage('Invalid request ID'),
  ],
};