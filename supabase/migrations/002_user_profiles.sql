-- User Profiles Migration
-- Adds structured profile data instead of raw text

-- Create user_profiles table with structured data
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal Information
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  other_links JSONB DEFAULT '[]'::jsonb,
  
  -- Professional Summary
  summary TEXT,
  
  -- Skills (structured as groups)
  skills JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "name": "Languages", "items": ["Python", "JavaScript"] }]
  
  -- Experience
  experience JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "company": "", "title": "", "location": "", "start": "", "end": "", "current": false, "bullets": [], "technologies": [] }]
  
  -- Education
  education JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "institution": "", "degree": "", "field": "", "location": "", "start": "", "end": "", "gpa": "", "achievements": [] }]
  
  -- Projects
  projects JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "name": "", "description": "", "technologies": [], "url": "", "start": "", "end": "" }]
  
  -- Certifications
  certifications JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "name": "", "issuer": "", "date": "", "expiry": "", "url": "", "credential_id": "" }]
  
  -- Original uploaded file info
  uploaded_file_name TEXT,
  uploaded_file_type TEXT,
  uploaded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update base_resumes to link to profile instead of raw text
-- Add profile_id column (we keep raw_text for backward compatibility)
ALTER TABLE public.base_resumes 
  ADD COLUMN profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX idx_base_resumes_profile_id ON public.base_resumes(profile_id);

