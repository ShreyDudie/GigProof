import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ZKProofService } from '../services/zkProof';
import { BehavioralDNAService } from '../services/behavioralDNA';
import { supabase } from '../database/supabase';
import {
  createCredential,
  findCredentialsByWorker,
  findCredentialById,
  updateCredential,
  createAccessRequest,
  createConsentLog,
} from '../database/helpers';

export class CredentialsController {
  private static getParamId(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] : value || '';
  }

  /**
   * Get worker's credentials
   */
  static async getCredentials(
    req: Request,
    res: Response
  ): Promise<void> {
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

      let query = supabase.from('credentials').select('*').eq('worker_id', workerId);
      if (type) query = query.eq('type', type as string);
      if (tier) query = query.eq('tier', tier as string);
      query = query.order('issued_at', { ascending: false });

      const { data: credentials, error } = await query;
      if (error) throw error;

      res.json({
        success: true,
        data: credentials,
      });
    } catch (error) {
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
  static async issueCredential(
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

      const { type, tier } = req.body;
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const credentialData = await this.generateCredentialData(workerId, type);
      const avgIncome = Number(credentialData?.metadata?.averageMonthly || credentialData?.metadata?.totalIncome || 0);
      const zkProof = await ZKProofService.generateProof({
        credentialType: type,
        claim: {
          field: 'income',
          operator: 'gt',
          value: Math.max(0, Math.floor(avgIncome * 0.8)),
        },
        privateInput: avgIncome,
      });

      const credential = await createCredential({
        worker_id: workerId,
        type,
        tier,
        issuer: 'GigProof',
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vc_jwt: `mock_vc_jwt_${Date.now()}`,
        zk_proof_ready: true,
        revoked: false,
        metadata: {
          ...credentialData.metadata,
          zkProof,
        },
        created_at: new Date(),
        updated_at: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Credential issued successfully',
        data: credential,
      });
    } catch (error) {
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
  static async revokeCredential(
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

      const credentialId = this.getParamId(req.params.credentialId);
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const credential = await findCredentialById(credentialId);
      if (!credential || credential.worker_id !== workerId) {
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

      const updatedCredential = await updateCredential(credentialId, {
        revoked: true,
        revoked_at: new Date(),
        updated_at: new Date(),
      });

      res.json({
        success: true,
        message: 'Credential revoked successfully',
        data: updatedCredential,
      });
    } catch (error) {
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
  static async shareCredential(
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

      const { credentialId, lenderId, purpose, scope } = req.body;
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const credential = await findCredentialById(credentialId);
      if (!credential || credential.worker_id !== workerId || credential.revoked) {
        res.status(404).json({
          success: false,
          error: 'Credential not found or revoked',
        });
        return;
      }

      const accessToken = `access_token_${Math.random().toString(36).substring(2, 16)}`;
      const accessRequest = await createAccessRequest({
        lender_id: lenderId,
        worker_id: workerId,
        purpose,
        scope_requested: scope,
        scope_granted: scope,
        status: 'APPROVED',
        token: accessToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      });

      await createConsentLog({
        worker_id: workerId,
        action: 'GRANTED',
        actor_id: lenderId,
        scope,
        timestamp: new Date(),
      });

      res.json({
        success: true,
        message: 'Credential shared successfully',
        data: {
          accessToken: accessRequest.token,
          expiresAt: accessRequest.expires_at,
          scope: accessRequest.scope_granted,
        },
      });
    } catch (error) {
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
  static async verifyCredential(
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

      const { proof, publicSignals, verificationKey } = req.body;
      const verification = await ZKProofService.verifyProof(
        proof,
        publicSignals,
        verificationKey || JSON.stringify({ protocol: 'groth16', mock: true })
      );
      const isValid = verification.valid;

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
    } catch (error) {
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
  static async getCredentialStats(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { data: credentials, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('worker_id', workerId);

      if (error) throw error;

      const stats = {
        total: credentials.length,
        active: credentials.filter((c: any) => !c.revoked).length,
        revoked: credentials.filter((c: any) => c.revoked).length,
        byType: credentials.reduce((acc: Record<string, number>, c: any) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        }, {}),
        byTier: credentials.reduce((acc: Record<string, number>, c: any) => {
          acc[c.tier] = (acc[c.tier] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
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
  private static async generateCredentialData(workerId: string, type: string) {
    const { data: worker, error } = await supabase
      .from('worker_profiles')
      .select('*, income_records(*), credentials(*)')
      .eq('user_id', workerId)
      .single();

    if (error || !worker) {
      throw new Error('Worker profile not found');
    }

    switch (type) {
      case 'INCOME': {
        const totalIncome = worker.income_records.reduce((sum: number, rec: any) => sum + rec.amount, 0);
        const averageMonthly = worker.income_records.length > 0
          ? totalIncome / worker.income_records.length
          : 0;

        return {
          metadata: {
            totalIncome,
            averageMonthly,
            platforms: [...new Set(worker.income_records.map((r: any) => r.source))],
            consistencyScore: 0.85,
            lastUpdated: new Date().toISOString(),
          },
        };
      }

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
            skills: worker.skills || ['Driving', 'Delivery'] ,
            verifiedSkills: (worker.skills || []).slice(0, 2),
            certifications: ['Basic Training', 'Safety Course'],
            lastUpdated: new Date().toISOString(),
          },
        };

      case 'EMPLOYMENT': {
        const behavioralDNA = await BehavioralDNAService.computeForWorker(workerId);
        return {
          metadata: {
            totalGigs: worker.income_records.length,
            activePlatforms: [...new Set(worker.income_records.map((r: any) => r.source))].length,
            tenure: '18 months',
            completionRate: 94,
            behavioralScore: behavioralDNA.overallScore,
            lastUpdated: new Date().toISOString(),
          },
        };
      }

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

// Validation rules
export const credentialValidators = {
  issueCredential: [
    body('type').isIn(['INCOME', 'RATING', 'SKILL', 'EMPLOYMENT', 'IDENTITY', 'PEER']).withMessage('Invalid credential type'),
    body('tier').isIn(['GOLD', 'SILVER', 'BRONZE', 'UNVERIFIED']).withMessage('Invalid tier'),
  ],
  revokeCredential: [
    param('credentialId').isUUID().withMessage('Invalid credential ID'),
  ],
  shareCredential: [
    body('credentialId').isUUID().withMessage('Invalid credential ID'),
    body('lenderId').isUUID().withMessage('Invalid lender ID'),
    body('purpose').isString().notEmpty().withMessage('Purpose is required'),
    body('scope').isArray().withMessage('Scope must be an array'),
  ],
  verifyCredential: [
    body('proof').isObject().withMessage('Proof is required'),
    body('publicSignals').isArray().withMessage('Public signals are required'),
  ],
};