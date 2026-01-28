-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  razorpay_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  resumes_generated_this_period INTEGER NOT NULL DEFAULT 0,
  max_resumes_per_period INTEGER NOT NULL DEFAULT 3,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Base Resumes table
CREATE TABLE public.base_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  parsed_resume_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  jd_text TEXT NOT NULL,
  extracted_requirements_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tailored Resumes table
CREATE TABLE public.tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  base_resume_id UUID NOT NULL REFERENCES public.base_resumes(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tailored_resume_json JSONB NOT NULL,
  ats_keyword_diff JSONB NOT NULL,
  ats_gap_report JSONB NOT NULL,
  docx_url TEXT,
  txt_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage Events table
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('tailor_resume', 'export_docx', 'export_txt', 'export_pdf')),
  model_name TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_base_resumes_user_id ON public.base_resumes(user_id);
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);
CREATE INDEX idx_tailored_resumes_base_job ON public.tailored_resumes(base_resume_id, job_id);
CREATE INDEX idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON public.usage_events(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Users: Users can only read/update their own record
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Base Resumes: Users can only access their own resumes
CREATE POLICY "Users can view own base resumes" ON public.base_resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own base resumes" ON public.base_resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own base resumes" ON public.base_resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own base resumes" ON public.base_resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs: Users can only access their own jobs
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Tailored Resumes: Users can only access their own tailored resumes
CREATE POLICY "Users can view own tailored resumes" ON public.tailored_resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tailored resumes" ON public.tailored_resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tailored resumes" ON public.tailored_resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Events: Users can only view their own usage
CREATE POLICY "Users can view own usage events" ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage events" ON public.usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan, max_resumes_per_period)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_base_resumes_updated_at
  BEFORE UPDATE ON public.base_resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

