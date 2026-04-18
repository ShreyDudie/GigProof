"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeValidators = exports.IncomeController = void 0;
const client_1 = require("prisma/client");
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
class IncomeController {
    /**
     * Get worker's income records
     */
    static async getIncomeRecords(req, res) {
        try {
            const workerId = req.user?.id;
            const { source, startDate, endDate, verified } = req.query;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const where = { workerId };
            if (source) {
                where.source = source;
            }
            if (verified !== undefined) {
                where.verified = verified === 'true';
            }
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = new Date(startDate);
                }
                if (endDate) {
                    where.createdAt.lte = new Date(endDate);
                }
            }
            const incomeRecords = await prisma.incomeRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            // Calculate summary statistics
            const totalIncome = incomeRecords.reduce((sum, rec) => sum + rec.amount, 0);
            const averageMonthly = incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;
            const verifiedRecords = incomeRecords.filter(rec => rec.verified);
            res.json({
                success: true,
                data: {
                    records: incomeRecords,
                    summary: {
                        totalRecords: incomeRecords.length,
                        verifiedRecords: verifiedRecords.length,
                        totalIncome,
                        averageMonthly,
                        sources: [...new Set(incomeRecords.map(r => r.source))],
                    },
                },
            });
        }
        catch (error) {
            console.error('Get income records error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Add manual income record
     */
    static async addIncomeRecord(req, res) {
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
            const { source, amount, currency, period, transactionRef } = req.body;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Check for duplicate transaction reference
            if (transactionRef) {
                const existing = await prisma.incomeRecord.findFirst({
                    where: {
                        workerId,
                        transactionRef,
                    },
                });
                if (existing) {
                    res.status(400).json({
                        success: false,
                        error: 'Transaction reference already exists',
                    });
                    return;
                }
            }
            const incomeRecord = await prisma.incomeRecord.create({
                data: {
                    workerId,
                    source,
                    amount,
                    currency: currency || 'INR',
                    period,
                    transactionRef,
                    verified: false, // Manual entries need verification
                },
            });
            res.status(201).json({
                success: true,
                message: 'Income record added successfully',
                data: incomeRecord,
            });
        }
        catch (error) {
            console.error('Add income record error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Update income record
     */
    static async updateIncomeRecord(req, res) {
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
            const { recordId } = req.params;
            const { amount, verified } = req.body;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const existingRecord = await prisma.incomeRecord.findFirst({
                where: {
                    id: recordId,
                    workerId,
                },
            });
            if (!existingRecord) {
                res.status(404).json({
                    success: false,
                    error: 'Income record not found',
                });
                return;
            }
            const updateData = {};
            if (amount !== undefined) {
                updateData.amount = amount;
            }
            if (verified !== undefined) {
                updateData.verified = verified;
            }
            const updatedRecord = await prisma.incomeRecord.update({
                where: { id: recordId },
                data: updateData,
            });
            res.json({
                success: true,
                message: 'Income record updated successfully',
                data: updatedRecord,
            });
        }
        catch (error) {
            console.error('Update income record error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Delete income record
     */
    static async deleteIncomeRecord(req, res) {
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
            const { recordId } = req.params;
            const workerId = req.user?.id;
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const existingRecord = await prisma.incomeRecord.findFirst({
                where: {
                    id: recordId,
                    workerId,
                },
            });
            if (!existingRecord) {
                res.status(404).json({
                    success: false,
                    error: 'Income record not found',
                });
                return;
            }
            await prisma.incomeRecord.delete({
                where: { id: recordId },
            });
            res.json({
                success: true,
                message: 'Income record deleted successfully',
            });
        }
        catch (error) {
            console.error('Delete income record error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get income analytics
     */
    static async getIncomeAnalytics(req, res) {
        try {
            const workerId = req.user?.id;
            const { timeframe } = req.query; // 'month', 'quarter', 'year'
            if (!workerId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const incomeRecords = await prisma.incomeRecord.findMany({
                where: { workerId },
                orderBy: { createdAt: 'asc' },
            });
            if (incomeRecords.length === 0) {
                res.json({
                    success: true,
                    data: {
                        analytics: {
                            totalIncome: 0,
                            averageMonthly: 0,
                            growthRate: 0,
                            consistencyIndex: 0,
                            bestMonth: null,
                            worstMonth: null,
                        },
                    },
                });
                return;
            }
            // Calculate analytics
            const totalIncome = incomeRecords.reduce((sum, rec) => sum + rec.amount, 0);
            const averageMonthly = totalIncome / incomeRecords.length;
            // Calculate growth rate (comparing first half vs second half)
            const midpoint = Math.floor(incomeRecords.length / 2);
            const firstHalf = incomeRecords.slice(0, midpoint);
            const secondHalf = incomeRecords.slice(midpoint);
            const firstHalfAvg = firstHalf.length > 0
                ? firstHalf.reduce((sum, rec) => sum + rec.amount, 0) / firstHalf.length
                : 0;
            const secondHalfAvg = secondHalf.length > 0
                ? secondHalf.reduce((sum, rec) => sum + rec.amount, 0) / secondHalf.length
                : 0;
            const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
            // Calculate consistency (coefficient of variation)
            const amounts = incomeRecords.map(rec => rec.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            const consistencyIndex = mean > 0 ? (1 - (stdDev / mean)) * 100 : 0;
            // Find best and worst months
            const monthlyTotals = incomeRecords.reduce((acc, rec) => {
                const month = rec.period.slice(0, 7); // YYYY-MM
                acc[month] = (acc[month] || 0) + rec.amount;
                return acc;
            }, {});
            const sortedMonths = Object.entries(monthlyTotals).sort(([, a], [, b]) => b - a);
            const bestMonth = sortedMonths[0] ? {
                period: sortedMonths[0][0],
                amount: sortedMonths[0][1],
            } : null;
            const worstMonth = sortedMonths[sortedMonths.length - 1] ? {
                period: sortedMonths[sortedMonths.length - 1][0],
                amount: sortedMonths[sortedMonths.length - 1][1],
            } : null;
            res.json({
                success: true,
                data: {
                    analytics: {
                        totalIncome,
                        averageMonthly,
                        growthRate,
                        consistencyIndex,
                        bestMonth,
                        worstMonth,
                        totalRecords: incomeRecords.length,
                        verifiedRecords: incomeRecords.filter(r => r.verified).length,
                    },
                },
            });
        }
        catch (error) {
            console.error('Get income analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Verify income record (admin/lender function)
     */
    static async verifyIncomeRecord(req, res) {
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
            const { recordId } = req.params;
            const { verified } = req.body;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            // Only admins and lenders can verify records
            if (!['ADMIN', 'LENDER'].includes(userRole || '')) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                });
                return;
            }
            const record = await prisma.incomeRecord.findUnique({
                where: { id: recordId },
            });
            if (!record) {
                res.status(404).json({
                    success: false,
                    error: 'Income record not found',
                });
                return;
            }
            const updatedRecord = await prisma.incomeRecord.update({
                where: { id: recordId },
                data: { verified },
            });
            // Log verification action
            await prisma.consentLog.create({
                data: {
                    workerId: record.workerId,
                    action: verified ? 'VIEWED' : 'REVOKED', // Using existing actions
                    actorId: userId,
                    scope: ['income_verification'],
                },
            });
            res.json({
                success: true,
                message: `Income record ${verified ? 'verified' : 'unverified'} successfully`,
                data: updatedRecord,
            });
        }
        catch (error) {
            console.error('Verify income record error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
}
exports.IncomeController = IncomeController;
// Validation rules
exports.incomeValidators = {
    addIncomeRecord: [
        (0, express_validator_1.body)('source').isString().notEmpty().withMessage('Source is required'),
        (0, express_validator_1.body)('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        (0, express_validator_1.body)('period').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Period must be in YYYY-MM-DD format'),
        (0, express_validator_1.body)('transactionRef').optional().isString().withMessage('Transaction reference must be a string'),
    ],
    updateIncomeRecord: [
        (0, express_validator_1.param)('recordId').isString().notEmpty().withMessage('Record ID is required'),
        (0, express_validator_1.body)('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        (0, express_validator_1.body)('verified').optional().isBoolean().withMessage('Verified must be a boolean'),
    ],
    deleteIncomeRecord: [
        (0, express_validator_1.param)('recordId').isString().notEmpty().withMessage('Record ID is required'),
    ],
    verifyIncomeRecord: [
        (0, express_validator_1.param)('recordId').isString().notEmpty().withMessage('Record ID is required'),
        (0, express_validator_1.body)('verified').isBoolean().withMessage('Verified status is required'),
    ],
};
//# sourceMappingURL=incomeController.js.map