-- Migration: Create auth_otp_codes table for Opal / Python ADK SMS verification
CREATE TABLE IF NOT EXISTS public.auth_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'sms',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0
);

-- Index on phone for fast lookup
CREATE INDEX IF NOT EXISTS idx_auth_otp_phone ON public.auth_otp_codes (phone);

-- Index on expiry to prune dead records
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires_at ON public.auth_otp_codes (expires_at);

-- RLS Policy
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for OTP generation"
ON public.auth_otp_codes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update for OTP verification"
ON public.auth_otp_codes FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated read"
ON public.auth_otp_codes FOR SELECT
USING (true);
