export declare class FraudDetectionService {
    /**
     * Analyze access patterns for potential fraud
     */
    static analyzeAccessPatterns(workerId: string): Promise<{
        riskScore: number;
        flags: string[];
        recommendations: string[];
    }>;
    /**
     * Detect suspicious credential sharing patterns
     */
    static detectCredentialAbuse(workerId: string): Promise<{
        suspicious: boolean;
        reasons: string[];
    }>;
    /**
     * Monitor for data tampering attempts
     */
    static detectDataTampering(workerId: string): Promise<{
        tampered: boolean;
        indicators: string[];
    }>;
    /**
     * Get behavioral DNA for fraud analysis
     */
    private static getBehavioralDNA;
    /**
     * Generate fraud alert for admin review
     */
    static generateFraudAlert(workerId: string, alertType: 'ACCESS_PATTERN' | 'CREDENTIAL_ABUSE' | 'DATA_TAMPERING', details: any): Promise<void>;
}
//# sourceMappingURL=fraudDetection.d.ts.map