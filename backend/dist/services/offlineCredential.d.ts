interface OfflineCredential {
    sub: string;
    name: string;
    score: number;
    incomeRange: string;
    rating: number;
    platforms: string[];
    kycVerified: boolean;
    issuedAt: Date;
    expiresAt: Date;
}
export declare class OfflineCredentialService {
    private static readonly JWT_SECRET;
    private static readonly ISSUER_DID;
    static generateOfflineCard(workerId: string): Promise<{
        qrDataUrl: string;
        jwt: string;
        expiresAt: Date;
    }>;
    static verifyOfflineCard(jwt: string): Promise<OfflineCredential>;
    private static computeIncomeRange;
    private static maskName;
}
export default OfflineCredentialService;
//# sourceMappingURL=offlineCredential.d.ts.map