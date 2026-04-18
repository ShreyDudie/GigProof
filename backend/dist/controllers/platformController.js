"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformValidators = exports.PlatformController = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
class PlatformController {
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
            // Mock OAuth flow - in production, this would redirect to platform's OAuth
            const mockAuthUrl = `https://${platform.toLowerCase()}.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read_profile,read_earnings&response_type=code`;
            res.json({
                success: true,
                data: {
                    authUrl: mockAuthUrl,
                    platform,
                    state: `state_${Math.random().toString(36).substr(2, 16)}`,
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
            const { code, state, platform } = req.query;
            const workerId = req.user?.id;
            if (!workerId || !code || !platform) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                });
                return;
            }
            // Mock token exchange
            const mockAccessToken = `mock_token_${Math.random().toString(36).substr(2, 16)}`;
            // Create platform connection
            const platformConnection = await prisma.platformConnection.upsert({
                where: {
                    workerId_platform: {
                        workerId,
                        platform: platform,
                    },
                },
                update: {
                    accessToken: mockAccessToken,
                    connectedAt: new Date(),
                    lastSyncAt: new Date(),
                    status: 'SUCCESS',
                },
                create: {
                    workerId,
                    platform: platform,
                    accessToken: mockAccessToken,
                    connectedAt: new Date(),
                    lastSyncAt: new Date(),
                    status: 'SUCCESS',
                },
            });
            // Trigger initial data sync
            await this.syncPlatformData(platformConnection.id);
            res.json({
                success: true,
                message: `Successfully connected to ${platform}`,
                data: {
                    connectionId: platformConnection.id,
                    platform,
                    connectedAt: platformConnection.connectedAt,
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
            const { platformConnectionId } = req.params;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const connection = await prisma.platformConnection.findFirst({
                where: {
                    id: platformConnectionId,
                    workerId,
                },
            });
            if (!connection) {
                res.status(404).json({
                    success: false,
                    error: 'Platform connection not found',
                });
                return;
            }
            // Update sync status
            await prisma.platformConnection.update({
                where: { id: platformConnectionId },
                data: {
                    status: 'PENDING',
                    lastSyncAt: new Date(),
                },
            });
            // Trigger sync job
            await this.syncPlatformData(platformConnectionId);
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
            const connections = await prisma.platformConnection.findMany({
                where: { workerId },
                orderBy: { connectedAt: 'desc' },
            });
            res.json({
                success: true,
                data: connections,
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
            // Mock OCR processing
            const mockOCRData = this.generateMockOCRData(platform);
            // Create income records from OCR data
            for (const record of mockOCRData.incomeRecords) {
                await prisma.incomeRecord.create({
                    data: {
                        workerId,
                        source: platform,
                        amount: record.amount,
                        currency: record.currency,
                        period: record.period,
                        transactionRef: record.transactionRef,
                        verified: false, // OCR data needs verification
                        smsRef: `ocr_${Date.now()}`,
                    },
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
    static async syncPlatformData(connectionId) {
        try {
            const connection = await prisma.platformConnection.findUnique({
                where: { id: connectionId },
                include: { worker: true },
            });
            if (!connection)
                return;
            // Mock API calls to platform
            const mockData = this.generateMockPlatformData(connection.platform);
            // Create income records
            for (const record of mockData.incomeRecords) {
                await prisma.incomeRecord.upsert({
                    where: {
                        workerId_source_period: {
                            workerId: connection.workerId,
                            source: connection.platform,
                            period: record.period,
                        },
                    },
                    update: {
                        amount: record.amount,
                        verified: true,
                    },
                    create: {
                        workerId: connection.workerId,
                        source: connection.platform,
                        amount: record.amount,
                        currency: record.currency,
                        period: record.period,
                        transactionRef: record.transactionRef,
                        verified: true,
                    },
                });
            }
            // Update connection status
            await prisma.platformConnection.update({
                where: { id: connectionId },
                data: {
                    status: 'SUCCESS',
                    lastSyncAt: new Date(),
                },
            });
        }
        catch (error) {
            console.error('Sync platform data error:', error);
            // Update connection status to failed
            await prisma.platformConnection.update({
                where: { id: connectionId },
                data: {
                    status: 'FAILED',
                    lastSyncAt: new Date(),
                },
            });
        }
    }
    /**
     * Generate mock platform data for demo
     */
    static generateMockPlatformData(platform) {
        const baseAmount = platform === 'UBER' ? 8000 : platform === 'SWIGGY' ? 6000 : 10000;
        const records = [];
        // Generate last 3 months of data
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const period = date.toISOString().slice(0, 10);
            records.push({
                amount: baseAmount + Math.floor(Math.random() * 2000),
                currency: 'INR',
                period,
                transactionRef: `${platform.toUpperCase()}_${Math.random().toString(36).substr(2, 8)}`,
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