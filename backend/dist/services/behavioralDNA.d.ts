interface BehavioralSignals {
    consistencyIndex: number;
    platformDiversification: number;
    growthTrajectory: number;
    demandResponsiveness: number;
    skillAcquisitionRate: number;
    recoverySpeed: number;
    reputationMomentum: number;
}
interface BehavioralDNA {
    signals: BehavioralSignals;
    overallScore: number;
    computedAt: Date;
}
export declare class BehavioralDNAService {
    static computeForWorker(workerId: string): Promise<BehavioralDNA>;
    private static computeSignals;
    private static computeConsistencyIndex;
    private static computePlatformDiversification;
    private static computeGrowthTrajectory;
    private static computeDemandResponsiveness;
    private static computeSkillAcquisitionRate;
    private static computeRecoverySpeed;
    private static computeReputationMomentum;
    private static computeOverallScore;
}
export default BehavioralDNAService;
//# sourceMappingURL=behavioralDNA.d.ts.map