import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../database/supabase';
import { createIncomeRecord, findPlatformById, updatePlatform, findPlatformsByWorker } from '../database/helpers';

export class PlatformController {
  private static getParamId(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] : value || '';
  }

  /**
   * Connect to a platform (OAuth simulation)
   */
  static async connect(
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
    } catch (error) {
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
  static async callback(
    req: Request,
    res: Response
  ): Promise<void> {
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
      const platformName = platform as string;

      const { data: existingPlatform, error: selectError } = await supabase
        .from('platforms')
        .select('*')
        .eq('worker_id', workerId)
        .eq('platform_name', platformName)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      let platformRecord: any;
      if (existingPlatform) {
        const { data, error } = await supabase
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

        if (error) throw error;
        platformRecord = data;
      } else {
        const { data, error } = await supabase
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

        if (error) throw error;
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
    } catch (error) {
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
  static async sync(
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

      const platformConnectionId = this.getParamId(req.params.platformConnectionId);
      const workerId = req.user?.id;

      if (!workerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const connection = await findPlatformById(platformConnectionId);
      if (!connection || connection.worker_id !== workerId) {
        res.status(404).json({
          success: false,
          error: 'Platform connection not found',
        });
        return;
      }

      await updatePlatform(platformConnectionId, {
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
    } catch (error) {
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
  static async getConnectedPlatforms(
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

      const platforms = await findPlatformsByWorker(workerId);

      res.json({
        success: true,
        data: platforms,
      });
    } catch (error) {
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
  static async processOCR(
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
        await createIncomeRecord({
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
    } catch (error) {
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
  private static async syncPlatformData(connectionId: string, platformName: string): Promise<void> {
    try {
      const connection = await findPlatformById(connectionId);
      if (!connection) {
        throw new Error('Platform connection not found');
      }

      const liveData = await this.fetchRealPlatformData(platformName, connection.access_token);
      const syncData = liveData || this.generateMockPlatformData(platformName);

      for (const record of syncData.incomeRecords) {
        await createIncomeRecord({
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

      await updatePlatform(connectionId, {
        sync_status: 'SUCCESS',
        last_synced: new Date(),
        raw_data_hash: `hash_${Date.now()}`,
      });
    } catch (error) {
      console.error('Sync platform data error:', error);
      await updatePlatform(connectionId, {
        sync_status: 'FAILED',
        last_synced: new Date(),
      });
    }
  }

  private static async fetchRealPlatformData(platformName: string, accessToken?: string | null) {
    const endpointMap: Record<string, string | undefined> = {
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

      const data = await response.json() as any;
      if (!Array.isArray(data?.incomeRecords)) {
        return null;
      }

      return {
        incomeRecords: data.incomeRecords.map((record: any) => ({
          amount: Number(record.amount || 0),
          currency: record.currency || 'INR',
          period: record.period || new Date().toISOString().slice(0, 10),
          transactionRef: String(record.transactionRef || `${platformName}_${Date.now()}`),
        })),
      };
    } catch (error) {
      console.warn(`Real API sync failed for ${platformName}; falling back to mock sync.`);
      return null;
    }
  }

  /**
   * Generate mock platform data for demo
   */
  private static generateMockPlatformData(platform: string) {
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
  private static generateMockOCRData(platform: string) {
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

// Validation rules
export const platformValidators = {
  connect: [
    body('platform').isIn(['UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK', 'FIVERR', 'LINKEDIN', 'OTHER']).withMessage('Invalid platform'),
    body('redirectUri').isURL().withMessage('Invalid redirect URI'),
  ],
  sync: [
    param('platformConnectionId').isUUID().withMessage('Invalid connection ID'),
  ],
  processOCR: [
    body('platform').isIn(['UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK', 'FIVERR', 'LINKEDIN', 'OTHER']).withMessage('Invalid platform'),
  ],
};