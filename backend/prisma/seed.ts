import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {},
    create: {
      phone: '+919999999999',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
    },
  });

  // Create demo workers
  const worker1User = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      role: 'WORKER',
      kycStatus: 'VERIFIED',
      did: 'did:poly:0x1234567890abcdef',
    },
  });

  const worker1Profile = await prisma.workerProfile.upsert({
    where: { userId: worker1User.id },
    update: {},
    create: {
      userId: worker1User.id,
      fullName: 'Ravi Kumar',
      preferredLang: 'hi',
      overallScore: 82,
      behavioralDNA: {
        consistencyIndex: 85,
        platformDiversification: 60,
        growthTrajectory: 78,
        demandResponsiveness: 90,
        skillAcquisitionRate: 70,
        recoverySpeed: 80,
        reputationMomentum: 75,
      },
    },
  });

  const worker2User = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      phone: '+919876543211',
      role: 'WORKER',
      kycStatus: 'VERIFIED',
      did: 'did:poly:0x1234567890abcdef1',
    },
  });

  const worker2Profile = await prisma.workerProfile.upsert({
    where: { userId: worker2User.id },
    update: {},
    create: {
      userId: worker2User.id,
      fullName: 'Priya Sharma',
      preferredLang: 'hi',
      overallScore: 61,
      behavioralDNA: {
        consistencyIndex: 65,
        platformDiversification: 80,
        growthTrajectory: 55,
        demandResponsiveness: 60,
        skillAcquisitionRate: 85,
        recoverySpeed: 70,
        reputationMomentum: 50,
      },
    },
  });

  const worker3User = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      phone: '+919876543212',
      role: 'WORKER',
      kycStatus: 'VERIFIED',
      did: 'did:poly:0x1234567890abcdef2',
    },
  });

  const worker3Profile = await prisma.workerProfile.upsert({
    where: { userId: worker3User.id },
    update: {},
    create: {
      userId: worker3User.id,
      fullName: 'Mohammed Arif',
      preferredLang: 'hi',
      overallScore: 34,
      behavioralDNA: {
        consistencyIndex: 40,
        platformDiversification: 20,
        growthTrajectory: 30,
        demandResponsiveness: 35,
        skillAcquisitionRate: 25,
        recoverySpeed: 45,
        reputationMomentum: 30,
      },
    },
  });

  // Create demo lenders
  const lender1User = await prisma.user.upsert({
    where: { phone: '+919876543213' },
    update: {},
    create: {
      phone: '+919876543213',
      role: 'LENDER',
      kycStatus: 'VERIFIED',
    },
  });

  const lender1Profile = await prisma.lenderProfile.upsert({
    where: { userId: lender1User.id },
    update: {},
    create: {
      userId: lender1User.id,
      orgName: 'Saraswat Co-operative Bank',
      licenseNumber: 'RBI123456',
      verified: true,
      verifiedAt: new Date(),
    },
  });

  const lender2User = await prisma.user.upsert({
    where: { phone: '+919876543214' },
    update: {},
    create: {
      phone: '+919876543214',
      role: 'LENDER',
      kycStatus: 'VERIFIED',
    },
  });

  const lender2Profile = await prisma.lenderProfile.upsert({
    where: { userId: lender2User.id },
    update: {},
    create: {
      userId: lender2User.id,
      orgName: 'FinCare NBFC',
      licenseNumber: 'NBFC789012',
      verified: false,
    },
  });

  // Create platforms for workers
  await prisma.platform.createMany({
    data: [
      {
        workerId: worker1Profile.id,
        platformName: 'SWIGGY',
        dataSource: 'OFFICIAL_API',
        syncStatus: 'SUCCESS',
        lastSynced: new Date(),
      },
      {
        workerId: worker1Profile.id,
        platformName: 'OLA',
        dataSource: 'OFFICIAL_API',
        syncStatus: 'SUCCESS',
        lastSynced: new Date(),
      },
      {
        worker2Profile.id,
        platformName: 'UPWORK',
        dataSource: 'OFFICIAL_API',
        syncStatus: 'SUCCESS',
        lastSynced: new Date(),
      },
      {
        worker2Profile.id,
        platformName: 'FIVERR',
        dataSource: 'OFFICIAL_API',
        syncStatus: 'SUCCESS',
        lastSynced: new Date(),
      },
      {
        worker3Profile.id,
        platformName: 'ZOMATO',
        dataSource: 'SCREENSHOT_OCR',
        syncStatus: 'SUCCESS',
        lastSynced: new Date(),
      },
    ],
  });

  // Create income records (12 months for each)
  const months = ['2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06', '2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12'];

  for (const month of months) {
    await prisma.incomeRecord.createMany({
      data: [
        {
          workerId: worker1Profile.id,
          source: 'Swiggy',
          amount: 25000 + Math.random() * 5000,
          period: month,
          verified: true,
        },
        {
          workerId: worker1Profile.id,
          source: 'Ola',
          amount: 18000 + Math.random() * 3000,
          period: month,
          verified: true,
        },
        {
          workerId: worker2Profile.id,
          source: 'Upwork',
          amount: 35000 + Math.random() * 10000,
          period: month,
          verified: true,
        },
        {
          workerId: worker2Profile.id,
          source: 'Fiverr',
          amount: 15000 + Math.random() * 5000,
          period: month,
          verified: true,
        },
        {
          workerId: worker3Profile.id,
          source: 'Zomato',
          amount: 12000 + Math.random() * 2000,
          period: month,
          verified: true,
        },
      ],
    });
  }

  // Create credentials
  await prisma.credential.createMany({
    data: [
      {
        workerId: worker1Profile.id,
        type: 'INCOME',
        tier: 'GOLD',
        issuer: 'GigProof',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vcJwt: 'mock.jwt.token',
        metadata: { avgMonthly: 43000 },
      },
      {
        workerId: worker1Profile.id,
        type: 'RATING',
        tier: 'SILVER',
        issuer: 'GigProof',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vcJwt: 'mock.jwt.token',
        metadata: { avgRating: 4.7 },
      },
      {
        workerId: worker2Profile.id,
        type: 'INCOME',
        tier: 'SILVER',
        issuer: 'GigProof',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vcJwt: 'mock.jwt.token',
        metadata: { avgMonthly: 50000 },
      },
      {
        workerId: worker2Profile.id,
        type: 'SKILL',
        tier: 'GOLD',
        issuer: 'GigProof',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vcJwt: 'mock.jwt.token',
        metadata: { skills: ['Web Development', 'Graphic Design'] },
      },
      {
        workerId: worker3Profile.id,
        type: 'INCOME',
        tier: 'BRONZE',
        issuer: 'GigProof',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        vcJwt: 'mock.jwt.token',
        metadata: { avgMonthly: 12000 },
      },
    ],
  });

  // Create peer attestations
  await prisma.peerAttestation.createMany({
    data: [
      {
        subjectId: worker1Profile.id,
        attesterId: worker2Profile.id,
        relationship: 'COWORKER',
        statement: 'Ravi is reliable and hardworking.',
        signature: 'mock.signature',
        weight: 0.8,
      },
      {
        subjectId: worker1Profile.id,
        attesterId: worker3Profile.id,
        relationship: 'NEIGHBOR',
        statement: 'Good person, always on time.',
        signature: 'mock.signature',
        weight: 0.6,
      },
      {
        subjectId: worker2Profile.id,
        attesterId: worker1Profile.id,
        relationship: 'COLLABORATED',
        statement: 'Priya delivered excellent work.',
        signature: 'mock.signature',
        weight: 0.9,
      },
    ],
  });

  // Create active access tokens
  await prisma.accessRequest.createMany({
    data: [
      {
        lenderId: lender1Profile.id,
        workerId: worker1Profile.id,
        purpose: 'Loan assessment',
        scopeRequested: ['INCOME', 'RATING'],
        scopeGranted: ['INCOME', 'RATING'],
        status: 'APPROVED',
        token: 'active.token.123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        lenderId: lender2Profile.id,
        workerId: worker2Profile.id,
        purpose: 'Credit evaluation',
        scopeRequested: ['INCOME', 'SKILL'],
        scopeGranted: ['INCOME'],
        status: 'APPROVED',
        token: 'expiring.token.456',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      },
    ],
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });