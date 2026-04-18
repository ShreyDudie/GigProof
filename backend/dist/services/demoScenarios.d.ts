export declare class DemoScenariosService {
    /**
     * Create comprehensive demo scenario for a worker
     */
    static createWorkerDemoScenario(phone: string): Promise<{
        worker: any;
        credentials: any[];
        behavioralDNA: any;
        fraudAnalysis: any;
    }>;
    /**
     * Create lender demo scenario
     */
    static createLenderDemoScenario(phone: string, orgName: string): Promise<any>;
    /**
     * Simulate access request workflow
     */
    static simulateAccessRequest(lenderId: string, workerId: string, purpose: string, scope: string[]): Promise<any>;
    /**
     * Generate demo report for lender
     */
    static generateLenderReport(lenderId: string): Promise<{
        totalWorkersAccessed: number;
        averageScore: number;
        riskDistribution: Record<string, number>;
        recentActivity: any[];
    }>;
    /**
     * Reset demo data
     */
    static resetDemoData(): Promise<void>;
}
//# sourceMappingURL=demoScenarios.d.ts.map