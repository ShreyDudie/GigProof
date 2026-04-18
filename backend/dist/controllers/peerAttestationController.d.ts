import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class PeerAttestationController {
    static createAttestation(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAttestations(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getGivenAttestations(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateAttestation(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteAttestation(req: AuthenticatedRequest, res: Response): Promise<void>;
    static verifyAttestation(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAttestationStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    private static calculateAttestationWeight;
}
export declare const peerAttestationValidators: {
    createAttestation: import("express-validator").ValidationChain[];
    updateAttestation: import("express-validator").ValidationChain[];
    deleteAttestation: import("express-validator").ValidationChain[];
    verifyAttestation: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=peerAttestationController.d.ts.map