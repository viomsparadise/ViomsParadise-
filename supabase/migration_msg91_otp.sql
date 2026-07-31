-- ============================================================================
-- MIGRATION: MSG91 OTP Rate Limiting
-- Run once in Supabase SQL Editor (or via: supabase db push)
-- Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
-- ============================================================================

-- Table to track OTP send attempts per phone number.
-- Used by the send-sms-hook Edge Function for rate limiting.
CREATE TABLE IF NOT EXISTS public.otp_attempts (
  phone          TEXT        PRIMARY KEY,          -- E.164 or raw digits
  hourly_count   INT         NOT NULL DEFAULT 0,   -- resets every hour
  last_sent_at   TIMESTAMPTZ,                      -- last time OTP was sent
  last_verified_at TIMESTAMPTZ                     -- last successful verification
);

-- Row-Level Security: the service role (Edge Functions) can read/write.
-- No direct client access needed — all OTP operations go through the Edge Function.
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;

-- Allow the service role full access (Edge Functions use the service role key)
CREATE POLICY IF NOT EXISTS "service_role_full_access"
  ON public.otp_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No public access
CREATE POLICY IF NOT EXISTS "no_public_access"
  ON public.otp_attempts
  FOR ALL
  TO anon, authenticated
  USING (false);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS otp_attempts_phone_idx ON public.otp_attempts (phone);

-- ============================================================================
-- Add system_logs entity_id column if it doesn't already exist.
-- The send-sms-hook logs SMS events to system_logs.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'system_logs'
      AND column_name  = 'entity_id'
  ) THEN
    ALTER TABLE public.system_logs ADD COLUMN entity_id TEXT;
  END IF;
END
$$;
