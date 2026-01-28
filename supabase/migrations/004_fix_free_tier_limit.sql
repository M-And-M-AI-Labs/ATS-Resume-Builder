-- Fix free tier users with 0 resume limit
-- Set their max_resumes_per_period to 3

UPDATE public.users 
SET max_resumes_per_period = 3 
WHERE plan = 'free' AND max_resumes_per_period = 0;

-- Also update any existing free users who don't have billing period set
UPDATE public.users 
SET 
  billing_period_start = NOW(),
  billing_period_end = NOW() + INTERVAL '30 days'
WHERE plan = 'free' AND billing_period_start IS NULL;

