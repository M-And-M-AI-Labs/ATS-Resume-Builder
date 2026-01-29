/**
 * Groq LLM Adapter Implementation
 * Uses Groq's OpenAI-compatible API
 */

import Groq from 'groq-sdk';
import { LLMAdapter, LLMUsage } from './adapter';
import { ResumeJSON, JobRequirements, ATSKeywordDiff, ATSGapReport } from '@/types/resume';
import { UserProfile } from '@/types/profile';
import { PROFILE_PARSER_SYSTEM_PROMPT, PROFILE_PARSER_USER_PROMPT, parseProfileResponse } from './profile-parser';
import { z } from 'zod';

const JobRequirementsSchema = z.object({
  mustHaveSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
  roleCategory: z.string(),
  seniorityLevel: z.string().nullable().optional(),
  hardRequirements: z.array(z.string()),
  softRequirements: z.array(z.string()),
});

const ResumeJSONSchema = z.object({
  header: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    links: z.array(z.object({
      type: z.string(),
      url: z.string(),
    })),
  }),
  summary: z.string().optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    location: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    gpa: z.string().optional(),
    honors: z.string().optional(),
    coursework: z.array(z.string()).optional(),
    studyAbroad: z.object({
      institution: z.string(),
      location: z.string(),
      program: z.string(),
      start: z.string(),
      end: z.string(),
    }).optional(),
  })),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    location: z.string(),
    start: z.string(),
    end: z.string(),
    bullets: z.array(z.string()),
    technologies: z.array(z.string()),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().optional(),
    date: z.string().optional(),
    achievement: z.string().optional(),
  })),
  activities: z.array(z.object({
    organization: z.string(),
    role: z.string(),
    start: z.string().optional(),
    end: z.string().optional(),
    bullets: z.array(z.string()),
  })),
  skills: z.object({
    groups: z.array(z.object({
      name: z.string(),
      items: z.array(z.string()),
    })),
  }),
  languages: z.array(z.object({
    name: z.string(),
    proficiency: z.string(),
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    expiry: z.string().optional(),
    url: z.string().optional(),
  })),
});

export class GroqAdapter implements LLMAdapter {
  private client: Groq;
  private model: string;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    // Default to Llama 3.1 70B or 8B, user can override with GROQ_MODEL env var
    // Available models: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
    this.model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
  }

  async extractJobRequirements(jdText: string): Promise<JobRequirements> {
    const systemPrompt = `You are a job description analyzer. Extract structured requirements from job postings.
Output ONLY valid JSON matching the schema.`;

    const userPrompt = `Extract job requirements from this job description:

${jdText}

Return a JSON object with:
- mustHaveSkills: array of required technical skills
- preferredSkills: array of nice-to-have skills
- responsibilities: array of key responsibilities
- keywords: array of important keywords/phrases
- roleCategory: one of "backend", "frontend", "fullstack", "ml", "devops", "mobile", "other"
- seniorityLevel: "junior", "mid", "senior", "lead", or null
- hardRequirements: array of must-have qualifications
- softRequirements: array of preferred qualifications

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Groq may return JSON wrapped in markdown, clean it up
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(cleanedContent);
    return JobRequirementsSchema.parse(parsed);
  }

  async parseResume(rawText: string): Promise<ResumeJSON> {
    const systemPrompt = `You are a resume parser. Convert raw resume text into structured JSON.
Preserve ALL information exactly as provided. Do not add, remove, or modify any facts.`;

    const userPrompt = `Parse this resume text into structured JSON:

${rawText}

Return a JSON object matching the resume schema. Preserve all dates, companies, titles, and achievements exactly as written.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Groq may return JSON wrapped in markdown, clean it up
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(cleanedContent);
    return ResumeJSONSchema.parse(parsed);
  }

  async parseProfile(rawText: string): Promise<UserProfile> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: PROFILE_PARSER_SYSTEM_PROMPT },
        { role: 'user', content: PROFILE_PARSER_USER_PROMPT(rawText) + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    return parseProfileResponse(content);
  }

  async tailorResume(
    baseResume: ResumeJSON,
    jobRequirements: JobRequirements
  ): Promise<{
    tailoredResume: ResumeJSON;
    keywordDiff: ATSKeywordDiff;
    gapReport: ATSGapReport;
  }> {
    const systemPrompt = `You are a resume editor. Your job is to tailor an existing resume to match job requirements.

CRITICAL RULES (DO NOT VIOLATE):
1. NEVER invent new companies, dates, degrees, or certifications
2. NEVER add achievements that weren't in the original resume
3. ONLY rewrite existing bullet points to emphasize relevant skills/achievements
4. ONLY reorder sections/bullets to highlight relevant experience
5. You can modify the summary to emphasize relevant skills
6. You can add keywords to existing bullets, but only if they accurately describe the work
7. If skills are missing, note them in the gap report, NOT in the resume body

You must return THREE JSON objects:
1. tailoredResume: The edited resume JSON
2. keywordDiff: { added: [], removed: [], emphasized: [] }
3. gapReport: { missingKeywords: [], matchedSkills: [], missingSkills: [], coverageScore: 0-100, suggestions: [] }`;

    const userPrompt = `Tailor this resume to match these job requirements:

BASE RESUME:
${JSON.stringify(baseResume, null, 2)}

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements, null, 2)}

Return a JSON object with three keys:
- tailoredResume: The edited resume (same structure as base)
- keywordDiff: Keywords added/removed/emphasized
- gapReport: Analysis of missing requirements and suggestions

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Groq may return JSON wrapped in markdown, clean it up
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(cleanedContent);
    
    // Validate the tailored resume matches schema
    const tailoredResume = ResumeJSONSchema.parse(parsed.tailoredResume);
    
    // Validate keyword diff
    const keywordDiff: ATSKeywordDiff = {
      added: Array.isArray(parsed.keywordDiff?.added) ? parsed.keywordDiff.added : [],
      removed: Array.isArray(parsed.keywordDiff?.removed) ? parsed.keywordDiff.removed : [],
      emphasized: Array.isArray(parsed.keywordDiff?.emphasized) ? parsed.keywordDiff.emphasized : [],
    };

    // Validate gap report
    const gapReport: ATSGapReport = {
      missingKeywords: Array.isArray(parsed.gapReport?.missingKeywords) ? parsed.gapReport.missingKeywords : [],
      matchedSkills: Array.isArray(parsed.gapReport?.matchedSkills) ? parsed.gapReport.matchedSkills : [],
      missingSkills: Array.isArray(parsed.gapReport?.missingSkills) ? parsed.gapReport.missingSkills : [],
      coverageScore: typeof parsed.gapReport?.coverageScore === 'number' ? parsed.gapReport.coverageScore : 0,
      suggestions: Array.isArray(parsed.gapReport?.suggestions) ? parsed.gapReport.suggestions : [],
    };

    return {
      tailoredResume,
      keywordDiff,
      gapReport,
    };
  }

  getUsage(response: any): LLMUsage {
    return {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      modelName: this.model,
    };
  }
}

