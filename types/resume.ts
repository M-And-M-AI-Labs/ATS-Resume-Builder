/**
 * Canonical Resume JSON Schema
 * This is the single source of truth for resume data.
 * LLM only edits this JSON, never raw DOCX/HTML.
 */

export interface ResumeHeader {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: Array<{
    type: string; // "LinkedIn", "GitHub", "Portfolio", etc.
    url: string;
  }>;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Experience {
  company: string;
  title: string;
  location: string;
  start: string; // YYYY-MM or "Jun 2017"
  end: string; // YYYY-MM or "Present"
  bullets: string[];
  technologies: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  date?: string; // e.g., "Feb 2017"
  achievement?: string; // e.g., "Google innovation award", "First Prize among 100 teams"
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  start?: string;
  end?: string;
  gpa?: string;
  honors?: string; // e.g., "Dean's List 2015-2016"
  coursework?: string[]; // Relevant coursework
  studyAbroad?: {
    institution: string;
    location: string;
    program: string;
    start: string;
    end: string;
  };
}

export interface Activity {
  organization: string;
  role: string;
  bullets: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiry?: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency: string; // "Fluent", "Native", "Conversational", "Basic"
}

export interface ResumeJSON {
  header: ResumeHeader;
  summary?: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  activities: Activity[];
  skills: {
    groups: SkillGroup[];
  };
  languages: Language[];
  certifications: Certification[];
}

/**
 * Job Requirements extracted from JD
 */
export interface JobRequirements {
  mustHaveSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  roleCategory: string; // "backend", "frontend", "ml", "devops", etc.
  seniorityLevel?: string | null; // "junior", "mid", "senior", "lead", or null
  hardRequirements: string[];
  softRequirements: string[];
}

/**
 * ATS Analysis Results
 */
export interface ATSKeywordDiff {
  added: string[];
  removed: string[];
  emphasized: string[];
}

export interface ATSGapReport {
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  coverageScore: number; // 0-100
  suggestions: string[];
}
