import { Request, Response } from 'express';
export declare class PlatformController {
    private static getParamId;
    /**
     * Connect to a platform (OAuth simulation)
     */
    static connect(req: Request, res: Response): Promise<void>;
    /**
     * Handle OAuth callback and process platform data
     */
    static callback(req: Request, res: Response): Promise<void>;
    /**
     * Sync data from connected platform
     */
    static sync(req: Request, res: Response): Promise<void>;
    /**
     * Get connected platforms for worker
     */
    static getConnectedPlatforms(req: Request, res: Response): Promise<void>;
    /**
     * Process OCR on uploaded document/screenshot
     */
    static processOCR(req: Request, res: Response): Promise<void>;
    /**
     * Private method to sync platform data
     */
    private static syncPlatformData;
    private static fetchRealPlatformData;
    /**
     * Generate mock platform data for demo
     */
    private static generateMockPlatformData;
    /**
     * Generate mock OCR data
     */
    private static generateMockOCRData;
}
export declare const platformValidators: {
    connect: import("express-validator").ValidationChain[];
    sync: import("express-validator").ValidationChain[];
    processOCR: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=platformController.d.ts.map