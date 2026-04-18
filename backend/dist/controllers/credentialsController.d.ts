import { Request, Response } from 'express';
export declare class CredentialsController {
    private static getParamId;
    /**
     * Get worker's credentials
     */
    static getCredentials(req: Request, res: Response): Promise<void>;
    /**
     * Issue a new credential
     */
    static issueCredential(req: Request, res: Response): Promise<void>;
    /**
     * Revoke a credential
     */
    static revokeCredential(req: Request, res: Response): Promise<void>;
    /**
     * Share credential with lender (generate access token)
     */
    static shareCredential(req: Request, res: Response): Promise<void>;
    /**
     * Verify credential using ZK proof
     */
    static verifyCredential(req: Request, res: Response): Promise<void>;
    /**
     * Get credential statistics
     */
    static getCredentialStats(req: Request, res: Response): Promise<void>;
    /**
     * Generate credential data based on type
     */
    private static generateCredentialData;
}
export declare const credentialValidators: {
    issueCredential: import("express-validator").ValidationChain[];
    revokeCredential: import("express-validator").ValidationChain[];
    shareCredential: import("express-validator").ValidationChain[];
    verifyCredential: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=credentialsController.d.ts.map