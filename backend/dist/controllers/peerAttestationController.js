"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peerAttestationValidators = exports.PeerAttestationController = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
class PeerAttestationController {
    /**
     * Create a peer attestation
     */
    static async createAttestation(req, res) {
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
            const { subjectId, relationship, statement } = req.body;
            const attesterId = req.user?.id;
            if (!attesterId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Prevent self-attestation
            if (attesterId === subjectId) {
                res.status(400).json({
                    success: false,
                    error: 'Cannot attest for yourself',
                });
                return;
            }
            // Check if both users exist and are workers
            const [subject, attester] = await Promise.all([
                prisma.workerProfile.findUnique({ where: { userId: subjectId } }),
                prisma.workerProfile.findUnique({ where: { userId: attesterId } }),
            ]);
            if (!subject || !attester) {
                res.status(404).json({
                    success: false,
                    error: 'Worker profile not found',
                });
                return;
            }
            // Calculate weight based on relationship
            const weight = this.calculateAttestationWeight(relationship);
            // Create mock signature (in production, this would be a real cryptographic signature)
            const signature = `mock_signature_${Math.random().toString(36).substr(2, 16)}`;
            const attestation = await prisma.peerAttestation.create({
                data: {
                    subjectId,
                    attesterId,
                    relationship,
                    statement,
                    signature,
                    weight,
                },
            });
            res.status(201).json({
                success: true,
                message: 'Peer attestation created successfully',
                data: attestation,
            });
        }
        catch (error) {
            console.error('Create attestation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get attestations for a worker
     */
    static async getAttestations(req, res) {
        try {
            const { workerId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Users can only view their own attestations or admins can view any
            if (userRole !== 'ADMIN' && userId !== workerId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            const attestations = await prisma.peerAttestation.findMany({
                where: { subjectId: workerId },
                include: {
                    subject: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    attester: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            // Calculate aggregated trust score
            const totalWeight = attestations.reduce((sum, att) => sum + att.weight, 0);
            const averageWeight = attestations.length > 0 ? totalWeight / attestations.length : 0;
            res.json({
                success: true,
                data: {
                    attestations,
                    summary: {
                        totalAttestations: attestations.length,
                        averageWeight,
                        totalWeight,
                    },
                },
            });
        }
        catch (error) {
            console.error('Get attestations error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get attestations given by a worker
     */
    static async getGivenAttestations(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const attestations = await prisma.peerAttestation.findMany({
                where: { attesterId: userId },
                include: {
                    subject: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json({
                success: true,
                data: attestations,
            });
        }
        catch (error) {
            console.error('Get given attestations error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Update attestation
     */
    static async updateAttestation(req, res) {
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
            const { attestationId } = req.params;
            const { statement, relationship } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const attestation = await prisma.peerAttestation.findUnique({
                where: { id: attestationId },
            });
            if (!attestation) {
                res.status(404).json({
                    success: false,
                    error: 'Attestation not found',
                });
                return;
            }
            // Only the attester can update their attestation
            if (attestation.attesterId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            const updateData = {};
            if (statement)
                updateData.statement = statement;
            if (relationship) {
                updateData.relationship = relationship;
                updateData.weight = this.calculateAttestationWeight(relationship);
            }
            const updatedAttestation = await prisma.peerAttestation.update({
                where: { id: attestationId },
                data: updateData,
            });
            res.json({
                success: true,
                message: 'Attestation updated successfully',
                data: updatedAttestation,
            });
        }
        catch (error) {
            console.error('Update attestation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Delete attestation
     */
    static async deleteAttestation(req, res) {
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
            const { attestationId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const attestation = await prisma.peerAttestation.findUnique({
                where: { id: attestationId },
            });
            if (!attestation) {
                res.status(404).json({
                    success: false,
                    error: 'Attestation not found',
                });
                return;
            }
            // Only the attester or admin can delete
            if (userRole !== 'ADMIN' && attestation.attesterId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            await prisma.peerAttestation.delete({
                where: { id: attestationId },
            });
            res.json({
                success: true,
                message: 'Attestation deleted successfully',
            });
        }
        catch (error) {
            console.error('Delete attestation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Verify attestation signature
     */
    static async verifyAttestation(req, res) {
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
            const { attestationId } = req.params;
            const attestation = await prisma.peerAttestation.findUnique({
                where: { id: attestationId },
                include: {
                    attester: true,
                    subject: true,
                },
            });
            if (!attestation) {
                res.status(404).json({
                    success: false,
                    error: 'Attestation not found',
                });
                return;
            }
            // Mock signature verification (in production, verify cryptographic signature)
            const isValid = attestation.signature.startsWith('mock_signature_');
            res.json({
                success: true,
                data: {
                    attestationId,
                    verified: isValid,
                    weight: attestation.weight,
                    relationship: attestation.relationship,
                    attester: {
                        id: attestation.attester.id,
                        name: attestation.attester.fullName,
                    },
                    subject: {
                        id: attestation.subject.id,
                        name: attestation.subject.fullName,
                    },
                },
            });
        }
        catch (error) {
            console.error('Verify attestation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get attestation statistics
     */
    static async getAttestationStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const [receivedAttestations, givenAttestations] = await Promise.all([
                prisma.peerAttestation.findMany({
                    where: { subjectId: userId },
                }),
                prisma.peerAttestation.findMany({
                    where: { attesterId: userId },
                }),
            ]);
            const stats = {
                received: {
                    total: receivedAttestations.length,
                    byRelationship: receivedAttestations.reduce((acc, att) => {
                        acc[att.relationship] = (acc[att.relationship] || 0) + 1;
                        return acc;
                    }, {}),
                    averageWeight: receivedAttestations.length > 0
                        ? receivedAttestations.reduce((sum, att) => sum + att.weight, 0) / receivedAttestations.length
                        : 0,
                },
                given: {
                    total: givenAttestations.length,
                    byRelationship: givenAttestations.reduce((acc, att) => {
                        acc[att.relationship] = (acc[att.relationship] || 0) + 1;
                        return acc;
                    }, {}),
                },
            };
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Get attestation stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Calculate attestation weight based on relationship
     */
    static calculateAttestationWeight(relationship) {
        const weights = {
            COWORKER: 0.8,
            NEIGHBOR: 0.6,
            COLLABORATED: 0.9,
        };
        return weights[relationship] || 0.5;
    }
}
exports.PeerAttestationController = PeerAttestationController;
// Validation rules
exports.peerAttestationValidators = {
    createAttestation: [
        (0, express_validator_1.body)('subjectId').isUUID().withMessage('Invalid subject ID'),
        (0, express_validator_1.body)('relationship').isIn(['COWORKER', 'NEIGHBOR', 'COLLABORATED']).withMessage('Invalid relationship'),
        (0, express_validator_1.body)('statement').isString().isLength({ min: 10, max: 500 }).withMessage('Statement must be 10-500 characters'),
    ],
    updateAttestation: [
        (0, express_validator_1.param)('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
        (0, express_validator_1.body)('statement').optional().isString().isLength({ min: 10, max: 500 }).withMessage('Statement must be 10-500 characters'),
        (0, express_validator_1.body)('relationship').optional().isIn(['COWORKER', 'NEIGHBOR', 'COLLABORATED']).withMessage('Invalid relationship'),
    ],
    deleteAttestation: [
        (0, express_validator_1.param)('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
    ],
    verifyAttestation: [
        (0, express_validator_1.param)('attestationId').isString().notEmpty().withMessage('Attestation ID is required'),
    ],
};
//# sourceMappingURL=peerAttestationController.js.map