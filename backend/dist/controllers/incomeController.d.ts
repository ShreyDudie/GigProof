import { Request, Response } from 'express';
export declare class IncomeController {
    private static getParamId;
    static getIncomeRecords(req: Request, res: Response): Promise<void>;
    static addIncomeRecord(req: Request, res: Response): Promise<void>;
    static updateIncomeRecord(req: Request, res: Response): Promise<void>;
    static deleteIncomeRecord(req: Request, res: Response): Promise<void>;
    static getIncomeAnalytics(req: Request, res: Response): Promise<void>;
    static verifyIncomeRecord(req: Request, res: Response): Promise<void>;
}
export declare const incomeValidators: {
    addIncomeRecord: import("express-validator").ValidationChain[];
    updateIncomeRecord: import("express-validator").ValidationChain[];
    deleteIncomeRecord: import("express-validator").ValidationChain[];
    verifyIncomeRecord: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=incomeController.d.ts.map