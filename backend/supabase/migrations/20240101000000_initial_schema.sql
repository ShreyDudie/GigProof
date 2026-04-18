-- Create custom types (enums)
CREATE TYPE role AS ENUM ('WORKER', 'LENDER', 'ADMIN');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'PARTIAL', 'VERIFIED', 'REJECTED');
CREATE TYPE platform_name AS ENUM ('UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK', 'FIVERR', 'LINKEDIN', 'OTHER');
CREATE TYPE data_source AS ENUM ('OFFICIAL_API', 'EMAIL_PARSE', 'SMS_PARSE', 'SCREENSHOT_OCR', 'ACCESSIBILITY');
CREATE TYPE sync_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'STALE');
CREATE TYPE credential_type AS ENUM ('INCOME', 'RATING', 'SKILL', 'EMPLOYMENT', 'IDENTITY', 'PEER');
CREATE TYPE tier AS ENUM ('GOLD', 'SILVER', 'BRONZE', 'UNVERIFIED');
CREATE TYPE relationship AS ENUM ('COWORKER', 'NEIGHBOR', 'COLLABORATED');
CREATE TYPE access_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');
CREATE TYPE consent_action AS ENUM ('GRANTED', 'REVOKED', 'VIEWED', 'SHARED');
CREATE TYPE otp_purpose AS ENUM ('LOGIN', 'KYC', 'CONSENT', 'SHARE');
CREATE TYPE whatsapp_direction AS ENUM ('INBOUND', 'OUTBOUND');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    aadhaar_hash TEXT,
    pan_hash TEXT,
    role role NOT NULL,
    kyc_status kyc_status DEFAULT 'PENDING',
    did TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create worker_profiles table
CREATE TABLE worker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    preferred_lang TEXT NOT NULL,
    profile_photo TEXT,
    behavioral_dna JSONB,
    overall_score REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platforms table
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    platform_name platform_name NOT NULL,
    external_id TEXT,
    access_token TEXT,
    data_source data_source NOT NULL,
    last_synced TIMESTAMP WITH TIME ZONE,
    raw_data_hash TEXT,
    sync_status sync_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credentials table
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    type credential_type NOT NULL,
    tier tier NOT NULL,
    issuer TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    vc_jwt TEXT NOT NULL,
    zk_proof_ready BOOLEAN DEFAULT FALSE,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create income_records table
CREATE TABLE income_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    period TEXT NOT NULL,
    transaction_ref TEXT,
    sms_ref TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create peer_attestations table
CREATE TABLE peer_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    attester_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    relationship relationship NOT NULL,
    statement TEXT NOT NULL,
    signature TEXT NOT NULL,
    weight REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lender_profiles table
CREATE TABLE lender_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_requests table
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lender_profiles(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    scope_requested TEXT[] NOT NULL,
    scope_granted TEXT[] NOT NULL,
    status access_status DEFAULT 'PENDING',
    token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consent_logs table
CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action consent_action NOT NULL,
    actor_id UUID NOT NULL,
    scope TEXT[] NOT NULL,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create otp_verifications table
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    purpose otp_purpose NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_logs table
CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from TEXT NOT NULL,
    message TEXT NOT NULL,
    direction whatsapp_direction NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for otp_verifications.user
ALTER TABLE otp_verifications
ADD CONSTRAINT fk_otp_verifications_user
FOREIGN KEY (phone) REFERENCES users(phone) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX idx_platforms_worker_id ON platforms(worker_id);
CREATE INDEX idx_credentials_worker_id ON credentials(worker_id);
CREATE INDEX idx_income_records_worker_id ON income_records(worker_id);
CREATE INDEX idx_peer_attestations_subject_id ON peer_attestations(subject_id);
CREATE INDEX idx_peer_attestations_attester_id ON peer_attestations(attester_id);
CREATE INDEX idx_lender_profiles_user_id ON lender_profiles(user_id);
CREATE INDEX idx_access_requests_lender_id ON access_requests(lender_id);
CREATE INDEX idx_access_requests_worker_id ON access_requests(worker_id);
CREATE INDEX idx_consent_logs_worker_id ON consent_logs(worker_id);
CREATE INDEX idx_otp_verifications_phone ON otp_verifications(phone);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worker_profiles_updated_at BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lender_profiles_updated_at BEFORE UPDATE ON lender_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may need to adjust based on your auth requirements)
-- Users can read/update their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Worker profiles policies
CREATE POLICY "Workers can view own profile" ON worker_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Workers can update own profile" ON worker_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Similar policies for other tables (simplified for demo)
-- You should create more specific policies based on your business logic