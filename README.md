# GigProof - Digital Identity for Gig Workers

GigProof helps gig workers build verifiable digital identity and income proofs that lenders can evaluate with worker consent.

## Current Stack

### Mobile
- React Native (Expo)
- TypeScript
- React Navigation (role-based + tab flows)
- Zustand + React Query
- NativeWind

### Backend
- Node.js + Express + TypeScript
- Supabase (Postgres + REST)
- JWT auth
- Multer for uploads

### Crypto and Identity
- did-jwt / did-resolver
- snarkjs (mocked flow for hackathon/dev)
- @noble/ed25519

## What Is Implemented

### Worker App
- Onboarding flow: KYC, platform connect, profile setup
- Home dashboard: score card, activity, quick actions
- Identity tab: credentials list, trust badges, QR share
- Earnings tab: analytics + chart
- Share tab: access request view + QR generation
- Profile tab: low bandwidth mode, offline mode, queue sync

### Lender App
- Dashboard
- Verify worker screen
- Requests management
- Account and compliance summary

### Admin App
- Overview metrics
- Workers view
- Lenders view
- Credentials operations screen
- Logs screen

### Backend Features
- Auth OTP flow
- KYC flow (mock UIDAI behavior)
- Credentials, income, access, attestations routes
- Verify routes for lender/admin
- WhatsApp webhook route + signature check + test endpoint
- Optional real platform API fetch with fallback to mock platform data

## Prerequisites

- Node.js 18+
- npm
- Supabase project
- Expo CLI (optional but recommended)

## Setup

### 1. Install dependencies

```bash
# backend
cd backend
npm install

# mobile
cd ../mobile
npm install
```

### 2. Configure backend environment

Create `backend/.env` from `backend/.env.example`.

Required values:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- `POLYGON_RPC_URL`
- `PRIVATE_KEY`

Recommended:
- `JWT_SECRET`

Optional:
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `UBER_EARNINGS_API`
- `OLA_EARNINGS_API`
- `SWIGGY_EARNINGS_API`
- `ZOMATO_EARNINGS_API`
- `URBAN_COMPANY_EARNINGS_API`
- `UPWORK_EARNINGS_API`
- `FIVERR_EARNINGS_API`
- `LINKEDIN_EARNINGS_API`

### 3. Where to get keys

- Supabase keys:
  - Supabase Dashboard -> Project Settings -> API
  - `Project URL` -> `SUPABASE_URL`
  - `anon public` -> `SUPABASE_ANON_KEY`
  - `service_role` -> `SUPABASE_SERVICE_ROLE_KEY`
- JWT secrets:
  - Generate long random strings.
- `ENCRYPTION_KEY`:
  - 32-byte hex key (64 hex chars).
- `POLYGON_RPC_URL`:
  - RPC provider endpoint (Alchemy/Infura/QuickNode).
- `PRIVATE_KEY`:
  - Test wallet key for dev only.
- WhatsApp:
  - Meta App Dashboard for app secret.
  - Verify token is your own chosen token configured in webhook settings.

## Run

### Backend

```bash
cd backend
npm run dev
```

### Mobile

```bash
cd mobile
npm start
```

## Dry Run Checklist

1. `GET /health` returns OK.
2. `POST /api/v1/auth/send-otp` creates OTP and logs OTP in backend console.
3. `POST /api/v1/auth/verify-otp` works with logged OTP.
4. `POST /api/v1/kyc/aadhaar/verify` accepts OTP `123456` in mock mode.
5. `GET /api/v1/whatsapp/webhook/test` returns live status.
6. Platform sync works even without platform API URLs using mock fallback.

## Mock Data and Mock Behavior

Currently active mocks in runtime:
- Auth OTP delivery is mock (OTP printed in server logs).
- KYC UIDAI flow is mock and accepts `123456`.
- WhatsApp conversational OTP flow uses mock logic.
- Platform integration auto-falls back to generated mock earnings if real API URL is missing.
- ZK proof service is mocked.

Important:
- There is no active one-command Supabase seed script wired in package scripts yet.
- Existing `backend/prisma/seed.ts` is Prisma-era and not part of current Supabase runtime path.

## API Base Paths

- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/kyc/aadhaar`
- `POST /api/v1/kyc/aadhaar/verify`
- `GET /api/v1/credentials`
- `GET /api/v1/income`
- `GET /api/v1/access/requests`
- `GET /api/v1/verify/worker`
- `GET /api/v1/verify/lender/dashboard`
- `GET /api/v1/verify/admin/health`

## Notes

- Mobile API URL is currently `http://localhost:3001/api/v1` in `mobile/src/services/api.ts`.
- For physical device testing, replace localhost with your machine LAN IP.

## License

MIT
