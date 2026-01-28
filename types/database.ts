/**
 * Database types matching Supabase schema
 */

export type UserPlan = "free" | "pro";

export interface User {
  id: string;
  email: string;
  razorpay_customer_id?: string;
  plan: UserPlan;
  resumes_generated_this_period: number;
  max_resumes_per_period: number;
  billing_period_start?: string;
  billing_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface BaseResume {
  id: string;
  user_id: string;
  raw_text: string;
  parsed_resume_json: any; // ResumeJSON
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  job_url: string;
  job_title?: string;
  company?: string;
  jd_text: string;
  extracted_requirements_json: any; // JobRequirements
  created_at: string;
}

export interface TailoredResume {
  id: string;
  user_id: string;
  base_resume_id: string;
  job_id: string;
  tailored_resume_json: any; // ResumeJSON
  ats_keyword_diff: any; // ATSKeywordDiff
  ats_gap_report: any; // ATSGapReport
  docx_url?: string;
  txt_url?: string;
  pdf_url?: string;
  created_at: string;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: "tailor_resume" | "export_docx" | "export_txt" | "export_pdf";
  model_name: string;
  input_tokens?: number;
  output_tokens?: number;
  created_at: string;
}

