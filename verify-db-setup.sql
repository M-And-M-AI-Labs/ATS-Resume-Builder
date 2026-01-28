-- Verification Queries
-- Run these in Supabase SQL Editor to verify your setup

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'base_resumes', 'jobs', 'tailored_resumes', 'usage_events')
ORDER BY table_name;

-- Expected: 5 rows returned

-- 2. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'base_resumes', 'jobs', 'tailored_resumes', 'usage_events')
ORDER BY tablename;

-- Expected: rowsecurity = true for all 5 tables

-- 3. Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Multiple policies (at least 2 per table)

-- 4. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'update_updated_at_column')
ORDER BY routine_name;

-- Expected: 2 rows (both functions)

-- 5. Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_auth_user_created', 'update_users_updated_at', 'update_base_resumes_updated_at')
ORDER BY trigger_name;

-- Expected: 3 rows (all triggers)

-- 6. Check if indexes exist
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'base_resumes', 'jobs', 'tailored_resumes', 'usage_events')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes (primary keys + custom indexes)

-- 7. Test: Check table structures
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Expected: Should show all columns (id, email, razorpay_customer_id, plan, etc.)

-- If all checks pass, your database is set up correctly! ✅

