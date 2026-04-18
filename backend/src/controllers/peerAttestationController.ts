import { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../database/supabase';
import {
  createPeerAttestation,
  deleteFromTable,
  findAttestationsByAttester,
  findAttestationsBySubject,
  findWorkerProfile,
} from '../database/helpers';
import { AuthenticatedRequest } from '../middleware/auth';

export class PeerAttestationController {
  static async createAttestation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { subjectId, relationship, statement } = req.body;
      const attesterUserId = req.user?.id;

      if (!attesterUserId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (attesterUserId === subjectId) {
        res.status(400).json({ success: false, error: 'Cannot attest for yourself' });
        return;
      }

      const [subject, attester] = await Promise.all([
        findWorkerProfile(subjectId),
        findWorkerProfile(attesterUserId),
      ]);

      if (!subject || !attester) {
        res.status(404).json({ success: false, error: 'Worker profile not found' });
        return;
      }

      const weight = this.calculateAttestationWeight(relationship);
      const signature = `mock_signature_${Math.random().toString(36).substring(2, 16)}`;

      const attestation = await createPeerAttestation({
        subject_id: subject.id,
        attester_id: attester.id,
        relationship,
        statement,
        signature,
        weight,
      });

      res.status(201).json({
        success: true,
        message: 'Peer attestation created successfully',
        data: attestation,
      });
    } catch (error) {
      console.error('Create attestation error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getAttestations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workerId = String(req.params.workerId);
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (userRole !== 'ADMIN' && userId !== workerId) {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
        return;
      }

      const subject = await findWorkerProfile(workerId);
      if (!subject) {
        res.status(404).json({ success: false, error: 'Worker profile not found' });
        return;
      }

      const attestations = await findAttestationsBySubject(subject.id);
      const safeAttestations = attestations || [];
      const totalWeight = safeAttestations.reduce((sum: number, att: any) => sum + att.weight, 0);
      const averageWeight = safeAttestations.length > 0 ? totalWeight / safeAttestations.length : 0;

      res.json({
        success: true,
        data: {
          attestations: safeAttestations,
          summary: {
            totalAttestations: safeAttestations.length,
            averageWeight,
            totalWeight,
          },
        },
      });
    } catch (error) {
      console.error('Get attestations error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getGivenAttestations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const attester = await findWorkerProfile(userId);
      if (!attester) {
        res.status(404).json({ success: false, error: 'Worker profile not found' });
        return;
      }

      const attestations = await findAttestationsByAttester(attester.id);
      res.json({ success: true, data: attestations || [] });
    } catch (error) {
      console.error('Get given attestations error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async updateAttestation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { attestationId } = req.params;
      const { statement, relationship } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { data: attestation, error } = await supabase
        .from('peer_attestations')
        .select('*')
        .eq('id', attestationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!attestation) {
        res.status(404).json({ success: false, error: 'Attestation not found' });
        return;
      }

      const attester = await findWorkerProfile(userId);
      if (!attester || attestation.attester_id !== attester.id) {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
        return;
      }

      const updateData: any = {};
      if (statement) updateData.statement = statement;
      if (relationship) {
        updateData.relationship = relationship;
        updateData.weight = this.calculateAttestationWeight(relationship);
      }

      const { data: updatedAttestation, error: updateError } = await supabase
        .from('peer_attestations')
        .update(updateData)
        .eq('id', attestationId)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({ success: true, message: 'Attestation updated successfully', data: updatedAttestation });
    } catch (error) {
      console.error('Update attestation error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async deleteAttestation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { attestationId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { data: attestation, error } = await supabase
        .from('peer_attestations')
        .select('*')
        .eq('id', attestationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!attestation) {
        res.status(404).json({ success: false, error: 'Attestation not found' });
        return;
      }

      const attester = await findWorkerProfile(userId);
      const canDelete = userRole === 'ADMIN' || (!!attester && attestation.attester_id === attester.id);
      if (!canDelete) {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
        return;
      }

      await deleteFromTable('peer_attestations', { id: attestationId });
      res.json({ success: true, message: 'Attestation deleted successfully' });
    } catch (error) {
      console.error('Delete attestation error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async verifyAttestation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
        return;
      }

      const { attestationId } = req.params;
      const { data: attestation, error } = await supabase
        .from('peer_attestations')
        .select('*, attester:worker_profiles!peer_attestations_attester_id_fkey(id, full_name), subject:worker_profiles!peer_attestations_subject_id_fkey(id, full_name)')
        .eq('id', attestationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!attestation) {
        res.status(404).json({ success: false, error: 'Attestation not found' });
        return;
      }

      const isValid = String(attestation.signature || '').startsWith('mock_signature_');
      res.json({
        success: true,
        data: {
          attestationId,
          verified: isValid,
          weight: attestation.weight,
          relationship: attestation.relationship,
          attester: {
            id: attestation.attester?.id,
            name: attestation.attester?.full_name,
          },
          subject: {
            id: attestation.subject?.id,
            name: attestation.subject?.full_name,
          },
        },
      });
    } catch (error) {
      console.error('Verify attestation error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async getAttestationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const worker = await findWorkerProfile(userId);
      if (!worker) {
        res.status(404).json({ success: false, error: 'Worker profile not found' });
        return;
      }

      const [receivedAttestations, givenAttestations] = await Promise.all([
        findAttestationsBySubject(worker.id),
        findAttestationsByAttester(worker.id),
      ]);

      const received = receivedAttestations || [];
      const given = givenAttestations || [];

      const stats = {
        received: {
          total: received.length,
          byRelationship: received.reduce((acc: Record<string, number>, att: any) => {
            acc[att.relationship] = (acc[att.relationship] || 0) + 1;
            return acc;
          }, {}),
          averageWeight: received.length > 0
            ? received.reduce((sum: number, att: any) => sum + att.weight, 0) / received.length
            : 0,
        },
        given: {
          total: given.length,
          byRelationship: given.reduce((acc: Record<string, number>, att: any) => {
            acc[att.relationship] = (acc[att.relationship] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get attestation stats error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  private static calculateAttestationWeight(relationship: string): number {
    const weights: Record<string, number> = {
      COWORKER: 0.8,
      NEIGHBOR: 0.6,
      COLLABORATED: 0.9,
    };

    return weights[relationship] || 0.5;
  }
}

export const peerAttestationValidators = {
  createAttestation: [
    body('subjectId').isUUID().withMessage('Invalid subject ID'),
    body('relationship').isIn(['COWORKER', 'NEIGHBOR', 'COLLABORATED']).withMessage('Invalid relationship'),
    body('statement').isString().isLength({ min: 10, max: 500 }).withMessage('Statement must be 10-500 characters'),
  ],
  updateAttestation: [
    param('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
    body('statement').optional().isString().isLength({ min: 10, max: 500 }).withMessage('Statement must be 10-500 characters'),
    body('relationship').optional().isIn(['COWORKER', 'NEIGHBOR', 'COLLABORATED']).withMessage('Invalid relationship'),
  ],
  deleteAttestation: [
    param('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
  ],
  verifyAttestation: [
    param('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
  ],
};
