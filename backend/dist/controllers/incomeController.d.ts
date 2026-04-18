import { Request, Response } from 'express';
export declare class IncomeController {
    /**
     * Get worker's income records
     */
    static getIncomeRecords(req: Request, res: Response): Promise<void>;
    /**
     * Add manual income record
     */
    static addIncomeRecord(req: Request, res: Response): Promise<void>;
    /**
     * Update income record
     */
    static updateIncomeRecord(req: Request, res: Response): Promise<void>;
    /**
     * Delete income record
     */
    static deleteIncomeRecord(req: Request, res: Response): Promise<void>;
    /**
     * Get income analytics
     */
    static getIncomeAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Verify income record (admin/lender function)
     */
    static verifyIncomeRecord(req: Request, res: Response): Promise<void>;
}
export declare const incomeValidators: {
    addIncomeRecord: import("express-validator").ValidationChain[];
    updateIncomeRecord: import("express-validator").ValidationChain[];
    deleteIncomeRecord: import("express-validator").ValidationChain[];
    verifyIncomeRecord: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=incomeController.d.ts.map