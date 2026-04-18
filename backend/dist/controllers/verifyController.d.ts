import { Request, Response } from 'express';
export declare class VerifyController {
    /**
     * Verify worker data for lender
     */
    static verifyWorker(req: Request, res: Response): Promise<void>;
    /**
     * Get lender dashboard data
     */
    static getLenderDashboard(req: Request, res: Response): Promise<void>;
    /**
     * Register new lender (admin approval required)
     */
    static registerLender(req: Request, res: Response): Promise<void>;
    /**
     * Admin: Approve or reject lender registration
     */
    static approveLender(req: Request, res: Response): Promise<void>;
    /**
     * Admin: Get all lenders
     */
    static getLenders(req: Request, res: Response): Promise<void>;
    /**
     * Admin: Get system health metrics
     */
    static getSystemHealth(req: Request, res: Response): Promise<void>;
}
export declare const verifyValidators: {
    verifyWorker: import("express-validator").ValidationChain[];
    registerLender: import("express-validator").ValidationChain[];
    approveLender: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=verifyController.d.ts.map