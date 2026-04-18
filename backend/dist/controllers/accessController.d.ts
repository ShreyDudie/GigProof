import { Request, Response } from 'express';
export declare class AccessController {
    private static getParamId;
    static requestAccess(req: Request, res: Response): Promise<void>;
    static getAccessRequests(req: Request, res: Response): Promise<void>;
    static respondToAccessRequest(req: Request, res: Response): Promise<void>;
    static revokeAccess(req: Request, res: Response): Promise<void>;
    static getConsentLogs(req: Request, res: Response): Promise<void>;
    static validateAccessToken(req: Request, res: Response): Promise<void>;
}
export declare const accessValidators: {
    requestAccess: import("express-validator").ValidationChain[];
    respondToAccessRequest: import("express-validator").ValidationChain[];
    revokeAccess: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=accessController.d.ts.map