import jwt from 'jsonwebtoken';
import qrcode from 'qrcode';
import { supabase } from '../database/supabase';

interface OfflineCredential {
  sub: string; // DID
  name: string;
  score: number;
  incomeRange: string;
  rating: number;
  platforms: string[];
  kycVerified: boolean;
  issuedAt: Date;
  expiresAt: Date;
}

export class OfflineCredentialService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'offline-credential-secret';
  private static readonly ISSUER_DID = 'did:poly:gigproof';

  static async generateOfflineCard(workerId: string): Promise<{
    qrDataUrl: string;
    jwt: string;
    expiresAt: Date;
  }> {
    const { data: worker, error } = await supabase
      .from('worker_profiles')
      .select('*, user:users(*), platforms(*), credentials(*)')
      .eq('id', workerId)
      .single();

    if (error || !worker) {
      throw new Error('Worker not found');
    }

    const credentials = (worker.credentials || []).filter((c: any) => ['INCOME', 'RATING'].includes(c.type) && ['GOLD', 'SILVER'].includes(c.tier));
    const incomeCred = credentials.find((c: any) => c.type === 'INCOME');
    const incomeRange = this.computeIncomeRange(incomeCred);

    const ratingCred = credentials.find((c: any) => c.type === 'RATING');
    const avgRating = ratingCred?.metadata?.avgRating || 4.0;

    const platforms = (worker.platforms || []).map((p: any) => (p.platform_name || p.platformName || '').toLowerCase());

    const payload: OfflineCredential = {
      sub: worker.user?.did || `did:worker:${workerId}`,
      name: this.maskName(worker.fullName),
      score: worker.overallScore || 0,
      incomeRange,
      rating: avgRating,
      platforms,
      kycVerified: worker.user?.kycStatus === 'VERIFIED',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    // Sign JWT
    const token = jwt.sign(payload, this.JWT_SECRET, {
      issuer: this.ISSUER_DID,
      expiresIn: '30d',
    });

    // Generate QR code
    const qrDataUrl = await qrcode.toDataURL(token, {
      width: 256,
      margin: 2,
    });

    return {
      qrDataUrl,
      jwt: token,
      expiresAt: payload.expiresAt,
    };
  }

  static async verifyOfflineCard(token: string): Promise<OfflineCredential> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as OfflineCredential;

      // Check if expired
      if (new Date() > new Date(decoded.expiresAt)) {
        throw new Error('Credential expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid offline credential');
    }
  }

  private static computeIncomeRange(incomeCred: any): string {
    if (!incomeCred?.metadata?.avgMonthly) {
      return 'Not available';
    }

    const avgIncome = incomeCred.metadata.avgMonthly;
    const lower = Math.floor(avgIncome * 0.8 / 1000) * 1000;
    const upper = Math.ceil(avgIncome * 1.2 / 1000) * 1000;

    return `${lower}k-${upper}k`;
  }

  private static maskName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length === 1) {
      return `${parts[0].charAt(0)}***`;
    }

    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    return `${firstName.charAt(0)}*** ${lastName.charAt(0)}***`;
  }
}

export default OfflineCredentialService;