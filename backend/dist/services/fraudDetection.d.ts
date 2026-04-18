export declare class FraudDetectionService {
    static analyzeAccessPatterns(workerProfileId: string): Promise<{
        riskScore: number;
        flags: string[];
        recommendations: string[];
    }>;
    static detectCredentialAbuse(workerProfileId: string): Promise<{
        suspicious: boolean;
        reasons: string[];
    }>;
    static detectDataTampering(workerProfileId: string): Promise<{
        tampered: boolean;
        indicators: string[];
    }>;
    private static getBehavioralDNA;
    static generateFraudAlert(workerUserId: string, alertType: 'ACCESS_PATTERN' | 'CREDENTIAL_ABUSE' | 'DATA_TAMPERING', details: any): Promise<void>;
}
//# sourceMappingURL=fraudDetection.d.ts.map