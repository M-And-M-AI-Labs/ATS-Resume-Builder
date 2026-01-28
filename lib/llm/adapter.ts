/**
 * LLM Adapter Interface
 * Abstract interface to allow swapping LLM providers
 */

import { ResumeJSON, JobRequirements, ATSKeywordDiff, ATSGapReport } from '@/types/resume';
import { UserProfile } from '@/types/profile';

export interface LLMAdapter {
  /**
   * Extract structured job requirements from JD text
   */
  extractJobRequirements(jdText: string): Promise<JobRequirements>;

  /**
   * Parse raw resume text into structured JSON (legacy)
   */
  parseResume(rawText: string): Promise<ResumeJSON>;

  /**
   * Parse raw resume text into structured UserProfile
   */
  parseProfile(rawText: string): Promise<UserProfile>;

  /**
   * Tailor resume to job requirements
   * Returns tailored resume + analysis
   */
  tailorResume(
    baseResume: ResumeJSON,
    jobRequirements: JobRequirements
  ): Promise<{
    tailoredResume: ResumeJSON;
    keywordDiff: ATSKeywordDiff;
    gapReport: ATSGapReport;
  }>;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  modelName: string;
}

