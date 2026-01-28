/**
 * Profile Parser using LLM
 * Extracts structured profile data from resume text
 */

import { UserProfile } from '@/types/profile';
import { z } from 'zod';

// Schema for LLM output validation
const ProfileSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  otherLinks: z.array(z.object({
    type: z.string(),
    url: z.string(),
  })).optional(),
  summary: z.string(),
  skills: z.array(z.object({
    name: z.string(),
    items: z.array(z.string()),
  })),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    location: z.string(),
    start: z.string(),
    end: z.string(),
    current: z.boolean(),
    bullets: z.array(z.string()),
    technologies: z.array(z.string()),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    location: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    gpa: z.string().optional(),
    honors: z.string().optional(),
    coursework: z.array(z.string()).optional(),
    achievements: z.array(z.string()).optional(),
    studyAbroad: z.object({
      institution: z.string(),
      location: z.string(),
      program: z.string(),
      start: z.string(),
      end: z.string(),
    }).optional(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().optional(),
    date: z.string().optional(),
    achievement: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
  })),
  activities: z.array(z.object({
    organization: z.string(),
    role: z.string(),
    bullets: z.array(z.string()),
  })).optional(),
  languages: z.array(z.object({
    name: z.string(),
    proficiency: z.string(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    expiry: z.string().optional(),
    url: z.string().optional(),
    credentialId: z.string().optional(),
  })),
});

export const PROFILE_PARSER_SYSTEM_PROMPT = `You are an expert resume parser. Your job is to extract structured profile data from resume text.

IMPORTANT RULES:
1. Extract ALL information exactly as written - do not modify, paraphrase, or add content
2. Preserve exact dates, company names, job titles, and achievements
3. If information is missing, use empty string or empty array as appropriate
4. For dates, use YYYY-MM format when possible (e.g., "2020-01") or natural format (e.g., "Jun 2017")
5. For "current" jobs, set end to empty string and current to true
6. Extract technologies/skills mentioned in job descriptions into the technologies array
7. Group skills by category (e.g., "Technical Skills", "Languages", "Frameworks", "Tools")
8. Parse URLs for LinkedIn, GitHub, Portfolio separately
9. Extract activities/extracurriculars into the activities array
10. Extract languages spoken into the languages array with proficiency levels

Return ONLY valid JSON matching the exact schema.`;

export const PROFILE_PARSER_USER_PROMPT = (resumeText: string) => `Parse this resume and extract structured profile data:

${resumeText}

Return a JSON object with these exact fields:
- fullName: string
- email: string
- phone: string
- location: string (city, state/country)
- linkedinUrl: string (if present)
- githubUrl: string (if present)
- portfolioUrl: string (if present)
- otherLinks: [{ type: string, url: string }]
- summary: string (professional summary/objective)
- skills: [{ name: string (category), items: string[] }]
- experience: [{ company, title, location, start, end (or empty if current), current: boolean, bullets: string[], technologies: string[] }]
- education: [{ institution, degree, field, location, start, end, gpa, honors, coursework: [], achievements: [], studyAbroad: { institution, location, program, start, end } }]
- projects: [{ name, description, technologies: [], url, date, achievement }]
- activities: [{ organization, role, bullets: [] }] (clubs, volunteering, extracurriculars)
- languages: [{ name, proficiency }] (e.g., { name: "French", proficiency: "Fluent" })
- certifications: [{ name, issuer, date, expiry, url, credentialId }]

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

/**
 * Clean and validate the LLM response
 */
export function parseProfileResponse(content: string): UserProfile {
  // Clean up potential markdown formatting
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
  }

  const parsed = JSON.parse(cleanedContent);
  const validated = ProfileSchema.parse(parsed);

  return {
    fullName: validated.fullName || '',
    email: validated.email || '',
    phone: validated.phone || '',
    location: validated.location || '',
    linkedinUrl: validated.linkedinUrl,
    githubUrl: validated.githubUrl,
    portfolioUrl: validated.portfolioUrl,
    otherLinks: validated.otherLinks || [],
    summary: validated.summary || '',
    skills: validated.skills || [],
    experience: validated.experience.map((exp, idx) => ({
      id: `exp-${idx}`,
      ...exp,
    })),
    education: validated.education.map((edu, idx) => ({
      id: `edu-${idx}`,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      location: edu.location || '',
      start: edu.start || '',
      end: edu.end || '',
      gpa: edu.gpa,
      honors: edu.honors,
      coursework: edu.coursework,
      achievements: edu.achievements || [],
      studyAbroad: edu.studyAbroad,
    })),
    projects: validated.projects.map((proj, idx) => ({
      id: `proj-${idx}`,
      ...proj,
    })),
    activities: (validated.activities || []).map((act, idx) => ({
      id: `act-${idx}`,
      ...act,
    })),
    languages: validated.languages || [],
    certifications: validated.certifications.map((cert, idx) => ({
      id: `cert-${idx}`,
      ...cert,
    })),
  };
}
