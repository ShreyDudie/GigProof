"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineCredentialService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const supabase_1 = require("../database/supabase");
class OfflineCredentialService {
    static async generateOfflineCard(workerId) {
        const { data: worker, error } = await supabase_1.supabase
            .from('worker_profiles')
            .select('*, user:users(*), platforms(*), credentials(*)')
            .eq('id', workerId)
            .single();
        if (error || !worker) {
            throw new Error('Worker not found');
        }
        const credentials = (worker.credentials || []).filter((c) => ['INCOME', 'RATING'].includes(c.type) && ['GOLD', 'SILVER'].includes(c.tier));
        const incomeCred = credentials.find((c) => c.type === 'INCOME');
        const incomeRange = this.computeIncomeRange(incomeCred);
        const ratingCred = credentials.find((c) => c.type === 'RATING');
        const avgRating = ratingCred?.metadata?.avgRating || 4.0;
        const platforms = (worker.platforms || []).map((p) => (p.platform_name || p.platformName || '').toLowerCase());
        const payload = {
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
        const token = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            issuer: this.ISSUER_DID,
            expiresIn: '30d',
        });
        // Generate QR code
        const qrDataUrl = await qrcode_1.default.toDataURL(token, {
            width: 256,
            margin: 2,
        });
        return {
            qrDataUrl,
            jwt: token,
            expiresAt: payload.expiresAt,
        };
    }
    static async verifyOfflineCard(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            // Check if expired
            if (new Date() > new Date(decoded.expiresAt)) {
                throw new Error('Credential expired');
            }
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid offline credential');
        }
    }
    static computeIncomeRange(incomeCred) {
        if (!incomeCred?.metadata?.avgMonthly) {
            return 'Not available';
        }
        const avgIncome = incomeCred.metadata.avgMonthly;
        const lower = Math.floor(avgIncome * 0.8 / 1000) * 1000;
        const upper = Math.ceil(avgIncome * 1.2 / 1000) * 1000;
        return `${lower}k-${upper}k`;
    }
    static maskName(fullName) {
        const parts = fullName.split(' ');
        if (parts.length === 1) {
            return `${parts[0].charAt(0)}***`;
        }
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        return `${firstName.charAt(0)}*** ${lastName.charAt(0)}***`;
    }
}
exports.OfflineCredentialService = OfflineCredentialService;
OfflineCredentialService.JWT_SECRET = process.env.JWT_SECRET || 'offline-credential-secret';
OfflineCredentialService.ISSUER_DID = 'did:poly:gigproof';
exports.default = OfflineCredentialService;
//# sourceMappingURL=offlineCredential.js.map