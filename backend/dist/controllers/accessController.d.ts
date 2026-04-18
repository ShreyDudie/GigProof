import { Request, Response } from 'express';
export declare class AccessController {
    /**
     * Request access to worker data
     */
    static requestAccess(req: Request, res: Response): Promise<void>;
    /**
     * Get access requests (for workers to view incoming requests)
     */
    static getAccessRequests(req: Request, res: Response): Promise<void>;
    /**
     * Approve or deny access request
     */
    static respondToAccessRequest(req: Request, res: Response): Promise<void>;
    /**
     * Revoke access token
     */
    static revokeAccess(req: Request, res: Response): Promise<void>;
    /**
     * Get consent logs
     */
    static getConsentLogs(req: Request, res: Response): Promise<void>;
    /**
     * Validate access token and get granted data
     */
    static validateAccessToken(req: Request, res: Response): Promise<void>;
}
export declare const accessValidators: {
    requestAccess: import("express-validator").ValidationChain[];
    respondToAccessRequest: import("express-validator").ValidationChain[];
    revokeAccess: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=accessController.d.ts.map