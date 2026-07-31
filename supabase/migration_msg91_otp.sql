-- ============================================================================
-- MIGRATION: MSG91 OTP Rate Limiting
-- Run once in Supabase SQL Editor (or via: supabase db push)
-- Safe to re-run.
-- ============================================================================

-- Table to track OTP send attempts per phone number.
-- Used by the send-sms-hook Edge Function for rate limiting.
CREATE TABLE IF NOT EXISTS public.otp_attempts (
  phone            TEXT        PRIMARY KEY,
  hourly_count     INT         NOT NULL DEFAULT 0,
  last_sent_at     TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ
);

-- Row-Level Security
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;

-- Service role full access (uses DO block for compatibility with PG < 15)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'otp_attempts'
      AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY "service_role_full_access"
      ON public.otp_attempts FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Block direct anon/authenticated access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'otp_attempts'
      AND policyname = 'no_public_access'
  ) THEN
    CREATE POLICY "no_public_access"
      ON public.otp_attempts FOR ALL TO anon, authenticated
      USING (false);
  END IF;
END
$$;

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS otp_attempts_phone_idx ON public.otp_attempts (phone);

-- ============================================================================
-- Add system_logs entity_id column if it doesn't already exist.
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
