import { Request, Response } from 'express';
export declare class PeerAttestationController {
    /**
     * Create a peer attestation
     */
    static createAttestation(req: Request, res: Response): Promise<void>;
    /**
     * Get attestations for a worker
     */
    static getAttestations(req: Request, res: Response): Promise<void>;
    /**
     * Get attestations given by a worker
     */
    static getGivenAttestations(req: Request, res: Response): Promise<void>;
    /**
     * Update attestation
     */
    static updateAttestation(req: Request, res: Response): Promise<void>;
    /**
     * Delete attestation
     */
    static deleteAttestation(req: Request, res: Response): Promise<void>;
    /**
     * Verify attestation signature
     */
    static verifyAttestation(req: Request, res: Response): Promise<void>;
    /**
     * Get attestation statistics
     */
    static getAttestationStats(req: Request, res: Response): Promise<void>;
    /**
     * Calculate attestation weight based on relationship
     */
    private static calculateAttestationWeight;
}
export declare const peerAttestationValidators: {
    createAttestation: import("express-validator").ValidationChain[];
    updateAttestation: import("express-validator").ValidationChain[];
    deleteAttestation: import("express-validator").ValidationChain[];
    verifyAttestation: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=peerAttestationController.d.ts.map