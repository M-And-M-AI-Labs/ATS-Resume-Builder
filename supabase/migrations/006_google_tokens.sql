-- Add Google OAuth token columns to users table
-- These are used for Google Sheets API access

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;

-- Add index for faster lookups when checking token validity
CREATE INDEX IF NOT EXISTS idx_users_google_token_expiry ON public.users(google_token_expiry);
