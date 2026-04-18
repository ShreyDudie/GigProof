import { findIncomeByWorker, findPlatformsByWorker, findCredentialsByWorker, findWorkerProfile, updateWorkerProfile } from '../database/helpers';

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

export class BehavioralDNAService {
  static async computeForWorker(workerId: string): Promise<BehavioralDNA> {
    const [incomeRecords, platforms, credentials, workerProfile] = await Promise.all([
      findIncomeByWorker(workerId),
      findPlatformsByWorker(workerId),
      findCredentialsByWorker(workerId),
      findWorkerProfile(workerId),
    ]);

    const signals = this.computeSignals(incomeRecords || [], platforms || [], credentials || []);
    const overallScore = this.computeOverallScore(signals);

    const behavioralDNA: BehavioralDNA = {
      signals,
      overallScore,
      computedAt: new Date(),
    };

    if (workerProfile?.id) {
      await updateWorkerProfile(workerProfile.id, {
        behavioralDNA,
        overallScore,
        updated_at: new Date(),
      });
    }

    return behavioralDNA;
  }

  private static computeSignals(
    incomeRecords: any[],
    platforms: any[],
    credentials: any[]
  ): BehavioralSignals {
    return {
      consistencyIndex: this.computeConsistencyIndex(incomeRecords),
      platformDiversification: this.computePlatformDiversification(platforms),
      growthTrajectory: this.computeGrowthTrajectory(incomeRecords),
      demandResponsiveness: this.computeDemandResponsiveness(incomeRecords),
      skillAcquisitionRate: this.computeSkillAcquisitionRate(credentials),
      recoverySpeed: this.computeRecoverySpeed(incomeRecords),
      reputationMomentum: this.computeReputationMomentum(incomeRecords),
    };
  }

  private static computeConsistencyIndex(incomeRecords: any[]): number {
    if (incomeRecords.length < 2) return 50; // Default for new workers

    const amounts = incomeRecords.map(r => r.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = stdDev / mean;
    const consistencyIndex = Math.max(0, 100 - (coefficientOfVariation * 100));

    return Math.min(100, consistencyIndex);
  }

  private static computePlatformDiversification(platforms: any[]): number {
    const uniquePlatforms = new Set(platforms.map(p => p.platformName)).size;
    let score = (uniquePlatforms / 5) * 100; // Max 5 platforms

    // Bonus for platform variety (delivery + freelance + ride-share)
    const categories = new Set();
    platforms.forEach(p => {
      if (['UBER', 'OLA'].includes(p.platformName)) categories.add('ride-share');
      if (['SWIGGY', 'ZOMATO'].includes(p.platformName)) categories.add('delivery');
      if (['UPWORK', 'FIVERR'].includes(p.platformName)) categories.add('freelance');
      if (['URBAN_COMPANY'].includes(p.platformName)) categories.add('services');
    });

    if (categories.size >= 2) score += 10;

    return Math.min(100, score);
  }

  private static computeGrowthTrajectory(incomeRecords: any[]): number {
    if (incomeRecords.length < 6) return 50; // Need at least 6 months

    // Group by month
    const monthlyIncome = new Map<string, number>();
    incomeRecords.forEach(record => {
      const month = record.period;
      monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + record.amount);
    });

    const sortedMonths = Array.from(monthlyIncome.entries()).sort();
    if (sortedMonths.length < 6) return 50;

    // Simple linear regression
    const n = sortedMonths.length;
    const x = sortedMonths.map((_, i) => i);
    const y = sortedMonths.map(([, income]) => income);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Normalize: negative slope = 0-50, positive slope = 50-100
    if (slope < 0) {
      return Math.max(0, 50 + slope * 10); // Arbitrary scaling
    } else {
      return Math.min(100, 50 + slope * 5); // Arbitrary scaling
    }
  }

  private static computeDemandResponsiveness(incomeRecords: any[]): number {
    if (incomeRecords.length < 3) return 50;

    // Group by month
    const monthlyIncome = new Map<string, number>();
    incomeRecords.forEach(record => {
      const month = record.period;
      monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + record.amount);
    });

    const incomes = Array.from(monthlyIncome.values());
    const avgIncome = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const maxIncome = Math.max(...incomes);

    if (avgIncome === 0) return 50;

    const responsiveness = ((maxIncome / avgIncome) - 1) * 100;
    return Math.min(100, responsiveness);
  }

  private static computeSkillAcquisitionRate(credentials: any[]): number {
    if (credentials.length === 0) return 0;

    const skillCredentials = credentials.filter(c => c.type === 'SKILL');
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const recentSkills = skillCredentials.filter(c => c.issuedAt >= oneYearAgo).length;

    // 1 cert = 20 points, 2 = 40, 3+ = 60, 5+ = 100
    if (recentSkills >= 5) return 100;
    if (recentSkills >= 3) return 60;
    if (recentSkills >= 2) return 40;
    if (recentSkills >= 1) return 20;
    return 0;
  }

  private static computeRecoverySpeed(incomeRecords: any[]): number {
    if (incomeRecords.length < 6) return 50;

    // Group by month
    const monthlyIncome = new Map<string, number>();
    incomeRecords.forEach(record => {
      const month = record.period;
      monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + record.amount);
    });

    const sortedMonths = Array.from(monthlyIncome.entries()).sort();
    let recoveryScore = 100;

    for (let i = 1; i < sortedMonths.length; i++) {
      const [, currentIncome] = sortedMonths[i];
      const [, prevIncome] = sortedMonths[i - 1];

      if (currentIncome < prevIncome * 0.8) { // 20% drop
        // Find how many months to recover
        let recoveryMonths = 0;
        for (let j = i + 1; j < sortedMonths.length; j++) {
          recoveryMonths++;
          const [, recoveryIncome] = sortedMonths[j];
          if (recoveryIncome >= prevIncome) break;
        }

        // 1 month = 100, 2 months = 75, 3 = 50, never = 10
        if (recoveryMonths === 1) recoveryScore = Math.min(recoveryScore, 100);
        else if (recoveryMonths === 2) recoveryScore = Math.min(recoveryScore, 75);
        else if (recoveryMonths === 3) recoveryScore = Math.min(recoveryScore, 50);
        else recoveryScore = Math.min(recoveryScore, 10);
      }
    }

    return recoveryScore;
  }

  private static computeReputationMomentum(incomeRecords: any[]): number {
    // For now, using income stability as proxy for reputation
    // In real implementation, this would use rating data from platforms
    return this.computeConsistencyIndex(incomeRecords);
  }

  private static computeOverallScore(signals: BehavioralSignals): number {
    return Math.round(
      signals.consistencyIndex * 0.25 +
      signals.growthTrajectory * 0.20 +
      signals.reputationMomentum * 0.20 +
      signals.platformDiversification * 0.15 +
      signals.recoverySpeed * 0.10 +
      signals.demandResponsiveness * 0.05 +
      signals.skillAcquisitionRate * 0.05
    );
  }
}

export default BehavioralDNAService;