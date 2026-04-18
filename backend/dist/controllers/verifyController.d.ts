import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class VerifyController {
    static verifyWorker(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getLenderDashboard(req: AuthenticatedRequest, res: Response): Promise<void>;
    static registerLender(req: AuthenticatedRequest, res: Response): Promise<void>;
    static approveLender(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getLenders(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const verifyValidators: {
    verifyWorker: import("express-validator").ValidationChain[];
    registerLender: import("express-validator").ValidationChain[];
    approveLender: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=verifyController.d.ts.map