# GigProof - Digital Identity for Gig Workers

A React Native mobile application that creates verifiable digital identities for gig workers in India, enabling them to access formal financial services.

## Problem Statement

Gig workers in India face significant challenges in accessing formal financial services due to lack of verifiable income proof and credit history. Traditional banking systems require formal employment documents that gig workers don't have. This creates a barrier to financial inclusion for millions of workers in the gig economy.

## Solution

GigProof creates a digital identity system where:
- **Workers** can connect their gig platforms and build verifiable credentials
- **Lenders** can assess creditworthiness using behavioral DNA analysis
- **Admins** oversee the platform and ensure compliance

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Node.js API   │    │   PostgreSQL    │
│   (Expo)        │◄──►│   (Express)     │◄──►│   (Prisma ORM)  │
│                 │    │                 │    │                 │
│ - Auth Screens  │    │ - JWT Auth      │    │ - User Profiles │
│ - Role-based UI │    │ - KYC Service   │    │ - Credentials   │
│ - ZK Proofs     │    │ - Platform APIs │    │ - Income Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blockchain    │    │   Redis Cache   │    │   Bull Queues   │
│   (Polygon)     │    │                 │    │                 │
│                 │    │ - Sessions      │    │ - Sync Jobs     │
│ - DID Registry  │    │ - API Cache     │    │ - ZK Proof Gen  │
│ - VC Issuance   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

### Frontend (React Native)
- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **State Management**: Zustand
- **Server State**: TanStack React Query
- **Styling**: NativeWind (Tailwind for RN)
- **Animations**: React Native Reanimated 3
- **Camera**: Expo Camera
- **SMS**: Expo SMS
- **Storage**: Expo SecureStore
- **i18n**: react-i18next (Hindi, English, Tamil, Telugu, Bengali)

### Backend (Node.js)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (access + refresh tokens)
- **Caching**: Redis
- **Job Queues**: Bull
- **File Uploads**: Multer
- **Testing**: Jest

### Blockchain & Cryptography
- **Network**: Polygon Mumbai (testnet)
- **DID**: did-jwt and did-resolver (W3C DIDs)
- **ZK Proofs**: snarkjs (mock implementation for hackathon)
- **Signing**: @noble/ed25519

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Expo CLI
- Git

## Local Setup

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install
```

### 2. Environment Configuration

Copy environment files:

```bash
# Backend
cp .env.example .env

# Update .env with your values:
DATABASE_URL="postgresql://username:password@localhost:5432/gigproof"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="32-char-encryption-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Start Services

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Redis (if not running)
redis-server

# Terminal 3: Mobile
npm start
```

## Demo Accounts

### Workers
- **Ravi Kumar**: +919876543210 (OTP: 123456)
- **Priya Sharma**: +919876543211 (OTP: 123456)
- **Mohammed Arif**: +919876543212 (OTP: 123456)

### Lenders
- **Saraswat Bank**: +919876543213 (OTP: 123456)
- **FinCare NBFC**: +919876543214 (OTP: 123456) - Pending approval

### Admin
- **Admin**: +919999999999 (OTP: 123456)

## Key Features

### For Workers
- **KYC Verification**: Aadhaar-based identity verification with OTP
- **Platform Integration**: Connect Uber, Ola, Swiggy, Upwork, Fiverr
- **Behavioral DNA**: 7-signal scoring system for credit assessment
- **Verifiable Credentials**: W3C VCs with ZK proofs for privacy
- **Offline QR**: Physical credential sharing
- **Peer Attestations**: Social proof from other workers

### For Lenders
- **QR Verification**: Scan worker credentials instantly
- **Risk Assessment**: Behavioral DNA radar charts
- **Access Control**: Granular permission management
- **ZK Proof Verification**: Privacy-preserving income proofs
- **Case Management**: Link verifications to loan applications

### For Admins
- **Platform Monitoring**: Real-time metrics and health checks
- **User Management**: KYC approvals and fraud detection
- **Credential Oversight**: Bulk operations and compliance
- **Audit Logs**: Complete consent and access tracking

## Behavioral DNA Signals

The platform computes 7 key signals for worker assessment:

1. **Consistency Index**: Income stability over time
2. **Platform Diversification**: Variety of income sources
3. **Growth Trajectory**: Income trend analysis
4. **Demand Responsiveness**: Peak earning periods
5. **Skill Acquisition**: New credential acquisition rate
6. **Recovery Speed**: Bounce-back from income drops
7. **Reputation Momentum**: Rating trend analysis

## ZK Proof System

For the hackathon, we've implemented a mock ZK proof system that:
- Maintains the same API as real snarkjs circuits
- Provides cryptographically structured proofs
- Can be swapped for real circom circuits in production

### Production Upgrade Path

1. Design circom circuits for each credential type
2. Generate trusted setup ceremonies
3. Deploy verification contracts to Polygon mainnet
4. Update proof generation to use real snarkjs

## API Documentation

### Authentication
```http
POST /api/v1/auth/send-otp
POST /api/v1/auth/verify-otp
POST /api/v1/auth/refresh
DELETE /api/v1/auth/logout
```

### KYC
```http
POST /api/v1/kyc/aadhaar
POST /api/v1/kyc/aadhaar/verify
POST /api/v1/kyc/liveness
GET /api/v1/kyc/status
```

### Credentials
```http
GET /api/v1/credentials
GET /api/v1/credentials/:id
POST /api/v1/credentials/:id/zkproof
DELETE /api/v1/credentials/:id
```

### Verification (Lender)
```http
GET /api/v1/verify/:token
```

## Security Features

- **Data Encryption**: AES-256-GCM for sensitive data
- **Token Security**: JWT with rotation and secure storage
- **Rate Limiting**: Per-user and per-IP limits
- **Input Validation**: Zod schemas on all endpoints
- **Biometric Auth**: Expo LocalAuthentication for sensitive actions
- **Certificate Pinning**: Backend certificate validation

## Known Limitations

1. **Mock ZK Proofs**: Current implementation is not truly zero-knowledge
2. **Limited Platform APIs**: Only mock integrations for development
3. **SMS Provider**: Using mock SMS service
4. **Blockchain**: Testnet only, mainnet deployment needed
5. **Offline QR**: Expires after 30 days, no revocation checking

## Production Deployment

### Infrastructure
- **Docker**: Containerized deployment
- **Kubernetes**: Orchestration for scaling
- **AWS/GCP**: Cloud hosting with CDN
- **PostgreSQL**: Managed database service
- **Redis**: Managed cache service

### Monitoring
- **Application Metrics**: Response times, error rates
- **Business Metrics**: User acquisition, conversion rates
- **Security Monitoring**: Failed auth attempts, suspicious patterns

## Team & Hackathon Context

This project was built for [Hackathon Name] to demonstrate how blockchain and ZK proofs can solve real-world financial inclusion challenges in emerging markets.

### Team Members
- [Your Name] - Full-stack Developer
- [Team Member] - Blockchain Engineer
- [Team Member] - UX Designer

### Tech Decisions
- **Expo**: Rapid development and cross-platform compatibility
- **Prisma**: Type-safe database operations
- **Zustand**: Lightweight state management
- **NativeWind**: Consistent styling system
- **Polygon**: Low-cost, fast Ethereum L2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or support, please contact [your-email@example.com]