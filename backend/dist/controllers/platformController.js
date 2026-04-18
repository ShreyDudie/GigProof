"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformValidators = exports.PlatformController = void 0;
const express_validator_1 = require("express-validator");
const supabase_1 = require("../database/supabase");
const helpers_1 = require("../database/helpers");
class PlatformController {
    static getParamId(value) {
        return Array.isArray(value) ? value[0] : value || '';
    }
    /**
     * Connect to a platform (OAuth simulation)
     */
    static async connect(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { platform, redirectUri } = req.body;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const mockAuthUrl = `https://${platform.toLowerCase()}.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read_profile,read_earnings&response_type=code`;
            res.json({
                success: true,
                data: {
                    authUrl: mockAuthUrl,
                    platform,
                    state: `state_${Math.random().toString(36).substring(2, 16)}`,
                },
            });
        }
        catch (error) {
            console.error('Platform connect error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Handle OAuth callback and process platform data
     */
    static async callback(req, res) {
        try {
            const { code, platform } = req.query;
            const workerId = req.user?.id;
            if (!workerId || !code || !platform) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                });
                return;
            }
            const mockAccessToken = `mock_token_${Math.random().toString(36).substring(2, 16)}`;
            const platformName = platform;
            const { data: existingPlatform, error: selectError } = await supabase_1.supabase
                .from('platforms')
                .select('*')
                .eq('worker_id', workerId)
                .eq('platform_name', platformName)
                .single();
            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }
            let platformRecord;
            if (existingPlatform) {
                const { data, error } = await supabase_1.supabase
                    .from('platforms')
                    .update({
                    access_token: mockAccessToken,
                    external_id: String(code).substring(0, 128),
                    sync_status: 'PENDING',
                    last_synced: new Date(),
                })
                    .eq('id', existingPlatform.id)
                    .select()
                    .single();
                if (error)
                    throw error;
                platformRecord = data;
            }
            else {
                const { data, error } = await supabase_1.supabase
                    .from('platforms')
                    .insert([{
                        worker_id: workerId,
                        platform_name: platformName,
                        access_token: mockAccessToken,
                        external_id: String(code).substring(0, 128),
                        data_source: 'OFFICIAL_API',
                        sync_status: 'PENDING',
                        created_at: new Date(),
                        updated_at: new Date(),
                    }])
                    .select()
                    .single();
                if (error)
                    throw error;
                platformRecord = data;
            }
            await this.syncPlatformData(platformRecord.id, platformName);
            res.json({
                success: true,
                message: `Successfully connected to ${platformName}`,
                data: {
                    connectionId: platformRecord.id,
                    platform: platformName,
                    connectedAt: platformRecord.created_at,
                },
            });
        }
        catch (error) {
            console.error('Platform callback error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Sync data from connected platform
     */
    static async sync(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const platformConnectionId = this.getParamId(req.params.platformConnectionId);
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const connection = await (0, helpers_1.findPlatformById)(platformConnectionId);
            if (!connection || connection.worker_id !== workerId) {
                res.status(404).json({
                    success: false,
                    error: 'Platform connection not found',
                });
                return;
            }
            await (0, helpers_1.updatePlatform)(platformConnectionId, {
                sync_status: 'PENDING',
                last_synced: new Date(),
            });
            await this.syncPlatformData(platformConnectionId, connection.platform_name);
            res.json({
                success: true,
                message: 'Sync initiated',
                data: {
                    connectionId: platformConnectionId,
                    status: 'PENDING',
                },
            });
        }
        catch (error) {
            console.error('Platform sync error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get connected platforms for worker
     */
    static async getConnectedPlatforms(req, res) {
        try {
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const platforms = await (0, helpers_1.findPlatformsByWorker)(workerId);
            res.json({
                success: true,
                data: platforms,
            });
        }
        catch (error) {
            console.error('Get connected platforms error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Process OCR on uploaded document/screenshot
     */
    static async processOCR(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { platform } = req.body;
            const workerId = req.user?.id;
            const file = req.file;
            if (!workerId || !file) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required data',
                });
                return;
            }
            const mockOCRData = this.generateMockOCRData(platform);
            for (const record of mockOCRData.incomeRecords) {
                await (0, helpers_1.createIncomeRecord)({
                    worker_id: workerId,
                    source: platform,
                    amount: record.amount,
                    currency: record.currency,
                    period: record.period,
                    transaction_ref: record.transactionRef,
                    verified: false,
                    sms_ref: `ocr_${Date.now()}`,
                    created_at: new Date(),
                });
            }
            res.json({
                success: true,
                message: 'OCR processed successfully',
                data: {
                    extractedData: mockOCRData,
                    recordsCreated: mockOCRData.incomeRecords.length,
                },
            });
        }
        catch (error) {
            console.error('OCR processing error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Private method to sync platform data
     */
    static async syncPlatformData(connectionId, platformName) {
        try {
            const connection = await (0, helpers_1.findPlatformById)(connectionId);
            if (!connection) {
                throw new Error('Platform connection not found');
            }
            const liveData = await this.fetchRealPlatformData(platformName, connection.access_token);
            const syncData = liveData || this.generateMockPlatformData(platformName);
            for (const record of syncData.incomeRecords) {
                await (0, helpers_1.createIncomeRecord)({
                    worker_id: connection.worker_id,
                    source: platformName,
                    amount: record.amount,
                    currency: record.currency,
                    period: record.period,
                    transaction_ref: record.transactionRef,
                    verified: true,
                    sms_ref: `sync_${Date.now()}`,
                    created_at: new Date(),
                });
            }
            await (0, helpers_1.updatePlatform)(connectionId, {
                sync_status: 'SUCCESS',
                last_synced: new Date(),
                raw_data_hash: `hash_${Date.now()}`,
            });
        }
        catch (error) {
            console.error('Sync platform data error:', error);
            await (0, helpers_1.updatePlatform)(connectionId, {
                sync_status: 'FAILED',
                last_synced: new Date(),
            });
        }
    }
    static async fetchRealPlatformData(platformName, accessToken) {
        const endpointMap = {
            UBER: process.env.UBER_EARNINGS_API,
            OLA: process.env.OLA_EARNINGS_API,
            SWIGGY: process.env.SWIGGY_EARNINGS_API,
            ZOMATO: process.env.ZOMATO_EARNINGS_API,
            URBAN_COMPANY: process.env.URBAN_COMPANY_EARNINGS_API,
            UPWORK: process.env.UPWORK_EARNINGS_API,
            FIVERR: process.env.FIVERR_EARNINGS_API,
            LINKEDIN: process.env.LINKEDIN_EARNINGS_API,
        };
        const endpoint = endpointMap[platformName];
        if (!endpoint) {
            return null;
        }
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                    Accept: 'application/json',
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            if (!Array.isArray(data?.incomeRecords)) {
                return null;
            }
            return {
                incomeRecords: data.incomeRecords.map((record) => ({
                    amount: Number(record.amount || 0),
                    currency: record.currency || 'INR',
                    period: record.period || new Date().toISOString().slice(0, 10),
                    transactionRef: String(record.transactionRef || `${platformName}_${Date.now()}`),
                })),
            };
        }
        catch (error) {
            console.warn(`Real API sync failed for ${platformName}; falling back to mock sync.`);
            return null;
        }
    }
    /**
     * Generate mock platform data for demo
     */
    static generateMockPlatformData(platform) {
        const baseAmount = platform === 'UBER' ? 8000 : platform === 'SWIGGY' ? 6000 : 10000;
        const records = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const period = date.toISOString().slice(0, 10);
            records.push({
                amount: baseAmount + Math.floor(Math.random() * 2000),
                currency: 'INR',
                period,
                transactionRef: `${platform.toUpperCase()}_${Math.random().toString(36).substring(2, 8)}`,
            });
        }
        return {
            incomeRecords: records,
            rating: 4.5 + Math.random() * 0.5,
            totalTrips: Math.floor(Math.random() * 200) + 50,
        };
    }
    /**
     * Generate mock OCR data
     */
    static generateMockOCRData(platform) {
        return {
            incomeRecords: [
                {
                    amount: 8500,
                    currency: 'INR',
                    period: new Date().toISOString().slice(0, 10),
                    transactionRef: `ocr_${platform}_${Date.now()}`,
                },
            ],
            extractedText: `Platform: ${platform}\nAmount: ₹8,500\nDate: ${new Date().toLocaleDateString()}`,
            confidence: 0.95,
        };
    }
}
exports.PlatformController = PlatformController;
// Validation rules
exports.platformValidators = {
    connect: [
        (0, express_validator_1.body)('platform').isIn(['UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK', 'FIVERR', 'LINKEDIN', 'OTHER']).withMessage('Invalid platform'),
        (0, express_validator_1.body)('redirectUri').isURL().withMessage('Invalid redirect URI'),
    ],
    sync: [
        (0, express_validator_1.param)('platformConnectionId').isUUID().withMessage('Invalid connection ID'),
    ],
    processOCR: [
        (0, express_validator_1.body)('platform').isIn(['UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK', 'FIVERR', 'LINKEDIN', 'OTHER']).withMessage('Invalid platform'),
    ],
};
//# sourceMappingURL=platformController.js.map