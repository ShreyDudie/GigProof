export declare class DemoScenariosService {
    static createWorkerDemoScenario(phone: string): Promise<{
        worker: any;
        credentials: any[];
        behavioralDNA: any;
        fraudAnalysis: any;
        offlineCredential: any;
    }>;
    static createLenderDemoScenario(phone: string, orgName: string): Promise<any>;
    static simulateAccessRequest(lenderProfileId: string, workerProfileId: string, purpose: string, scope: string[]): Promise<any>;
    static generateLenderReport(lenderProfileId: string): Promise<{
        totalWorkersAccessed: number;
        averageScore: number;
        riskDistribution: Record<string, number>;
        recentActivity: any[];
    }>;
    static resetDemoData(): Promise<void>;
}
//# sourceMappingURL=demoScenarios.d.ts.map