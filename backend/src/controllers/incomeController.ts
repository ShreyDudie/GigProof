import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../database/supabase';
import {
  findIncomeRecordById,
  createIncomeRecord,
  updateIncomeRecord,
  deleteIncomeRecord,
  createConsentLog,
} from '../database/helpers';

export class IncomeController {
  static async getIncomeRecords(
    req: Request,
    res: Response
  ): Promise<void> {
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

      let query = supabase.from('income_records').select('*').eq('worker_id', workerId).order('created_at', { ascending: false });

      if (source) query = query.eq('source', source as string);
      if (verified !== undefined) query = query.eq('verified', verified === 'true');
      if (startDate) query = query.gte('created_at', new Date(startDate as string));
      if (endDate) query = query.lte('created_at', new Date(endDate as string));

      const { data: incomeRecords = [], error } = await query;
      if (error) throw error;

      const totalIncome = incomeRecords.reduce((sum: number, rec: any) => sum + rec.amount, 0);
      const averageMonthly = incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;
      const verifiedRecords = incomeRecords.filter((rec: any) => rec.verified);

      res.json({
        success: true,
        data: {
          records: incomeRecords,
          summary: {
            totalRecords: incomeRecords.length,
            verifiedRecords: verifiedRecords.length,
            totalIncome,
            averageMonthly,
            sources: [...new Set(incomeRecords.map((r: any) => r.source))],
          },
        },
      });
    } catch (error) {
      console.error('Get income records error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async addIncomeRecord(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      if (transactionRef) {
        const { data: existing, error: existingError } = await supabase
          .from('income_records')
          .select('*')
          .eq('worker_id', workerId)
          .eq('transaction_ref', transactionRef)
          .single();

        if (existingError && existingError.code !== 'PGRST116') throw existingError;
        if (existing) {
          res.status(400).json({
            success: false,
            error: 'Transaction reference already exists',
          });
          return;
        }
      }

      const incomeRecord = await createIncomeRecord({
        worker_id: workerId,
        source,
        amount,
        currency: currency || 'INR',
        period,
        transaction_ref: transactionRef,
        verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Income record added successfully',
        data: incomeRecord,
      });
    } catch (error) {
      console.error('Add income record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async updateIncomeRecord(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const existingRecord = await findIncomeRecordById(recordId);
      if (!existingRecord || existingRecord.worker_id !== workerId) {
        res.status(404).json({
          success: false,
          error: 'Income record not found',
        });
        return;
      }

      const updateData: any = {};
      if (amount !== undefined) updateData.amount = amount;
      if (verified !== undefined) updateData.verified = verified;
      updateData.updated_at = new Date();

      const updatedRecord = await updateIncomeRecord(recordId, updateData);

      res.json({
        success: true,
        message: 'Income record updated successfully',
        data: updatedRecord,
      });
    } catch (error) {
      console.error('Update income record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async deleteIncomeRecord(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const existingRecord = await findIncomeRecordById(recordId);
      if (!existingRecord || existingRecord.worker_id !== workerId) {
        res.status(404).json({
          success: false,
          error: 'Income record not found',
        });
        return;
      }

      await deleteIncomeRecord(recordId);

      res.json({
        success: true,
        message: 'Income record deleted successfully',
      });
    } catch (error) {
      console.error('Delete income record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async getIncomeAnalytics(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { data: incomeRecords = [], error } = await supabase
        .from('income_records')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: true });

      if (error) throw error;

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

      const totalIncome = incomeRecords.reduce((sum: number, rec: any) => sum + rec.amount, 0);
      const averageMonthly = totalIncome / incomeRecords.length;

      const midpoint = Math.floor(incomeRecords.length / 2);
      const firstHalf = incomeRecords.slice(0, midpoint);
      const secondHalf = incomeRecords.slice(midpoint);

      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum: number, rec: any) => sum + rec.amount, 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum: number, rec: any) => sum + rec.amount, 0) / secondHalf.length
        : 0;

      const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
      const amounts = incomeRecords.map((rec: any) => rec.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const consistencyIndex = mean > 0 ? (1 - (stdDev / mean)) * 100 : 0;

      const monthlyTotals = incomeRecords.reduce((acc: Record<string, number>, rec: any) => {
        const month = rec.period.slice(0, 7);
        acc[month] = (acc[month] || 0) + rec.amount;
        return acc;
      }, {});

      const sortedMonths = Object.entries(monthlyTotals).sort(([,a], [,b]) => b - a);
      const bestMonth = sortedMonths[0] ? { period: sortedMonths[0][0], amount: sortedMonths[0][1] } : null;
      const worstMonth = sortedMonths[sortedMonths.length - 1] ? { period: sortedMonths[sortedMonths.length - 1][0], amount: sortedMonths[sortedMonths.length - 1][1] } : null;

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
            verifiedRecords: incomeRecords.filter((r: any) => r.verified).length,
          },
        },
      });
    } catch (error) {
      console.error('Get income analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async verifyIncomeRecord(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
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

      if (!['ADMIN', 'LENDER'].includes(userRole || '')) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      const record = await findIncomeRecordById(recordId);
      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Income record not found',
        });
        return;
      }

      const updatedRecord = await updateIncomeRecord(recordId, {
        verified,
        updated_at: new Date(),
      });

      await createConsentLog({
        worker_id: record.worker_id,
        action: verified ? 'VIEWED' : 'REVOKED',
        actor_id: userId,
        scope: ['income_verification'],
        timestamp: new Date(),
      });

      res.json({
        success: true,
        message: `Income record ${verified ? 'verified' : 'unverified'} successfully`,
        data: updatedRecord,
      });
    } catch (error) {
      console.error('Verify income record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const incomeValidators = {
  addIncomeRecord: [
    body('source').isString().notEmpty().withMessage('Source is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('period').isString().matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).withMessage('Period must be in YYYY-MM-DD format'),
    body('transactionRef').optional().isString().withMessage('Transaction reference must be a string'),
  ],
  updateIncomeRecord: [
    param('recordId').isString().notEmpty().withMessage('Record ID is required'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('verified').optional().isBoolean().withMessage('Verified must be a boolean'),
  ],
  deleteIncomeRecord: [
    param('recordId').isString().notEmpty().withMessage('Record ID is required'),
  ],
  verifyIncomeRecord: [
    param('recordId').isString().notEmpty().withMessage('Record ID is required'),
    body('verified').isBoolean().withMessage('Verified status is required'),
  ],
};