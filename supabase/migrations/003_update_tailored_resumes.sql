-- Update tailored_resumes table
-- Make base_resume_id nullable since we now support profile-based tailoring

ALTER TABLE public.tailored_resumes 
  ALTER COLUMN base_resume_id DROP NOT NULL;

-- Add profile_id reference (optional for backward compatibility)
ALTER TABLE public.tailored_resumes 
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_profile_id ON public.tailored_resumes(profile_id);

