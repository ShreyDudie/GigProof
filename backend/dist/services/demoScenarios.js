"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoScenariosService = void 0;
const client_1 = require("@prisma/client");
const behavioralDNA_1 = require("./behavioralDNA");
const zkProof_1 = require("./zkProof");
const offlineCredential_1 = require("./offlineCredential");
const fraudDetection_1 = require("./fraudDetection");
const prisma = new client_1.PrismaClient();
class DemoScenariosService {
    /**
     * Create comprehensive demo scenario for a worker
     */
    static async createWorkerDemoScenario(phone) {
        // Create or update worker profile
        const worker = await prisma.user.upsert({
            where: { phone },
            update: {
                role: 'WORKER',
            },
            create: {
                phone,
                role: 'WORKER',
            },
        });
        const workerProfile = await prisma.workerProfile.upsert({
            where: { userId: worker.id },
            update: {},
            create: {
                userId: worker.id,
                fullName: 'Rajesh Kumar Sharma',
                dateOfBirth: new Date('1995-06-15'),
                gender: 'MALE',
                address: '123 MG Road, Bangalore, Karnataka 560001',
                languages: ['Hindi', 'English', 'Kannada'],
                skills: ['Driving', 'Delivery', 'Customer Service'],
                kycStatus: 'VERIFIED',
                aadhaarVerified: true,
                panVerified: true,
                bankVerified: true,
                selfieVerified: true,
            },
        });
        // Create income records for behavioral DNA
        const incomeRecords = [
            { source: 'Uber', amount: 8500, period: '2024-01-01', transactionRef: 'UBR001' },
            { source: 'Uber', amount: 9200, period: '2024-01-15', transactionRef: 'UBR002' },
            { source: 'Swiggy', amount: 6500, period: '2024-01-01', transactionRef: 'SWG001' },
            { source: 'Swiggy', amount: 7100, period: '2024-01-15', transactionRef: 'SWG002' },
            { source: 'Urban Company', amount: 12000, period: '2024-02-01', transactionRef: 'UCB001' },
            { source: 'Urban Company', amount: 11800, period: '2024-02-15', transactionRef: 'UCB002' },
            { source: 'Uber', amount: 8800, period: '2024-02-01', transactionRef: 'UBR003' },
            { source: 'Uber', amount: 9500, period: '2024-02-15', transactionRef: 'UBR004' },
            { source: 'Swiggy', amount: 6800, period: '2024-02-01', transactionRef: 'SWG003' },
            { source: 'Swiggy', amount: 7200, period: '2024-02-15', transactionRef: 'SWG004' },
            { source: 'Urban Company', amount: 12500, period: '2024-03-01', transactionRef: 'UCB003' },
            { source: 'Urban Company', amount: 12200, period: '2024-03-15', transactionRef: 'UCB004' },
        ];
        for (const record of incomeRecords) {
            await prisma.incomeRecord.upsert({
                where: {
                    workerId_source_period: {
                        workerId: workerProfile.id,
                        source: record.source,
                        period: record.period,
                    },
                },
                update: {},
                create: {
                    workerId: workerProfile.id,
                    ...record,
                    verified: true,
                },
            });
        }
        // Create credentials
        const credentials = [];
        // Income credential
        const incomeCredential = await prisma.credential.upsert({
            where: { id: `income-${workerProfile.id}` },
            update: {},
            create: {
                workerId: workerProfile.id,
                type: 'INCOME',
                tier: 'GOLD',
                issuer: 'GigProof',
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                vcJwt: 'mock-vc-jwt-income',
                zkProofReady: true,
                metadata: {
                    totalIncome: 125000,
                    averageMonthly: 10416,
                    platforms: ['Uber', 'Swiggy', 'Urban Company'],
                    consistencyScore: 0.85,
                },
            },
        });
        credentials.push(incomeCredential);
        // Rating credential
        const ratingCredential = await prisma.credential.upsert({
            where: { id: `rating-${workerProfile.id}` },
            update: {},
            create: {
                workerId: workerProfile.id,
                type: 'RATING',
                tier: 'GOLD',
                issuer: 'GigProof',
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                vcJwt: 'mock-vc-jwt-rating',
                zkProofReady: true,
                metadata: {
                    averageRating: 4.7,
                    totalRatings: 245,
                    platforms: ['Uber', 'Swiggy', 'Urban Company'],
                    fiveStarPercentage: 78,
                },
            },
        });
        credentials.push(ratingCredential);
        // Employment credential
        const employmentCredential = await prisma.credential.upsert({
            where: { id: `employment-${workerProfile.id}` },
            update: {},
            create: {
                workerId: workerProfile.id,
                type: 'EMPLOYMENT',
                tier: 'SILVER',
                issuer: 'GigProof',
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                vcJwt: 'mock-vc-jwt-employment',
                zkProofReady: true,
                metadata: {
                    totalGigs: 156,
                    activePlatforms: 3,
                    tenure: '2 years',
                    completionRate: 94,
                },
            },
        });
        credentials.push(employmentCredential);
        // Compute behavioral DNA
        const behavioralDNA = await behavioralDNA_1.BehavioralDNAService.computeForWorker(workerProfile.id);
        // Generate ZK proofs for credentials
        for (const credential of credentials) {
            const proof = await zkProof_1.ZKProofService.generateProof({
                credentialId: credential.id,
                workerId: workerProfile.id,
                attributes: credential.metadata,
            });
            await prisma.credential.update({
                where: { id: credential.id },
                data: {
                    metadata: {
                        ...credential.metadata,
                        zkProof: proof,
                    },
                },
            });
        }
        // Create peer attestations
        const attestations = [
            {
                relationship: 'COWORKER',
                statement: 'Rajesh is reliable and punctual. Great team player.',
                weight: 0.8,
            },
            {
                relationship: 'NEIGHBOR',
                statement: 'Known him for 3 years. Honest and hardworking.',
                weight: 0.6,
            },
            {
                relationship: 'COLLABORATED',
                statement: 'Worked together on multiple projects. Excellent service quality.',
                weight: 0.9,
            },
        ];
        for (const att of attestations) {
            await prisma.peerAttestation.create({
                data: {
                    subjectId: workerProfile.id,
                    attesterId: 'mock-attester-' + Math.random().toString(36).substr(2, 9),
                    ...att,
                    signature: 'mock-signature-' + Math.random().toString(36).substr(2, 9),
                },
            });
        }
        // Generate offline credential
        const offlineCredential = await offlineCredential_1.OfflineCredentialService.generateOfflineCard(workerProfile.id);
        // Run fraud analysis
        const fraudAnalysis = await fraudDetection_1.FraudDetectionService.analyzeAccessPatterns(workerProfile.id);
        return {
            worker: workerProfile,
            credentials,
            behavioralDNA,
            fraudAnalysis,
            offlineCredential,
        };
    }
    /**
     * Create lender demo scenario
     */
    static async createLenderDemoScenario(phone, orgName) {
        const lender = await prisma.user.upsert({
            where: { phone },
            update: {
                role: 'LENDER',
            },
            create: {
                phone,
                role: 'LENDER',
            },
        });
        const lenderProfile = await prisma.lenderProfile.upsert({
            where: { userId: lender.id },
            update: {},
            create: {
                userId: lender.id,
                orgName,
                licenseNumber: `LIC${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                verified: true,
                verifiedAt: new Date(),
            },
        });
        return lenderProfile;
    }
    /**
     * Simulate access request workflow
     */
    static async simulateAccessRequest(lenderId, workerId, purpose, scope) {
        // Create access request
        const accessRequest = await prisma.accessRequest.create({
            data: {
                lenderId,
                workerId,
                purpose,
                scopeRequested: scope,
                scopeGranted: scope, // Auto-approve for demo
                status: 'APPROVED',
                token: `token_${Math.random().toString(36).substr(2, 16)}`,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });
        // Log consent
        await prisma.consentLog.create({
            data: {
                workerId,
                action: 'GRANTED',
                actorId: lenderId,
                scope,
            },
        });
        return accessRequest;
    }
    /**
     * Generate demo report for lender
     */
    static async generateLenderReport(lenderId) {
        const accessRequests = await prisma.accessRequest.findMany({
            where: { lenderId, status: 'APPROVED' },
            include: {
                worker: {
                    include: {
                        credentials: true,
                        incomeRecords: true,
                    },
                },
            },
        });
        const totalWorkersAccessed = accessRequests.length;
        const scores = accessRequests.map(req => {
            // Mock score calculation based on credentials
            const credentialCount = req.worker.credentials.length;
            const incomeSum = req.worker.incomeRecords.reduce((sum, rec) => sum + rec.amount, 0);
            return Math.min(100, (credentialCount * 10) + (incomeSum / 1000));
        });
        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;
        // Risk distribution
        const riskDistribution = {
            low: scores.filter(s => s >= 80).length,
            medium: scores.filter(s => s >= 60 && s < 80).length,
            high: scores.filter(s => s < 60).length,
        };
        const recentActivity = accessRequests
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5)
            .map(req => ({
            workerName: req.worker.fullName,
            purpose: req.purpose,
            score: scores[accessRequests.indexOf(req)],
            timestamp: req.createdAt,
        }));
        return {
            totalWorkersAccessed,
            averageScore,
            riskDistribution,
            recentActivity,
        };
    }
    /**
     * Reset demo data
     */
    static async resetDemoData() {
        // Clear all demo data
        await prisma.consentLog.deleteMany();
        await prisma.accessRequest.deleteMany();
        await prisma.peerAttestation.deleteMany();
        await prisma.credential.deleteMany();
        await prisma.incomeRecord.deleteMany();
        await prisma.workerProfile.deleteMany();
        await prisma.lenderProfile.deleteMany();
        await prisma.otpVerification.deleteMany();
        await prisma.whatsAppLog.deleteMany();
        // Reset users (keep admin)
        await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN',
                },
            },
        });
    }
}
exports.DemoScenariosService = DemoScenariosService;
//# sourceMappingURL=demoScenarios.js.map