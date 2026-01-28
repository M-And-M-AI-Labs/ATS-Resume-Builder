-- Add original_resume_json column to store the base resume for diff comparison
ALTER TABLE public.tailored_resumes
  ADD COLUMN IF NOT EXISTS original_resume_json JSONB;

-- Comment explaining the column
COMMENT ON COLUMN public.tailored_resumes.original_resume_json IS 'Stores the original resume JSON before tailoring, used for diff view';
