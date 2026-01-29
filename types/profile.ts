/**
 * User Profile Types
 * Structured profile data for resume generation
 */

import { ResumeJSON } from './resume';

export interface ProfileLink {
  type: string;
  url: string;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  location: string;
  start: string; // YYYY-MM format
  end: string; // YYYY-MM or "Present"
  current: boolean;
  bullets: string[];
  technologies: string[];
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  start: string;
  end: string;
  gpa?: string;
  honors?: string;
  coursework?: string[];
  achievements: string[];
  studyAbroad?: {
    institution: string;
    location: string;
    program: string;
    start: string;
    end: string;
  };
}

export interface Project {
  id?: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  date?: string;
  achievement?: string;
  start?: string;
  end?: string;
}

export interface Activity {
  id?: string;
  organization: string;
  role: string;
  start?: string; // e.g., "Sep 2017"
  end?: string; // e.g., "Present"
  bullets: string[];
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date?: string;
  expiry?: string;
  url?: string;
  credentialId?: string;
}

export interface Language {
  name: string;
  proficiency: string; // "Fluent", "Native", "Conversational", "Basic"
}

export interface UserProfile {
  id?: string;
  userId?: string;

  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  otherLinks: ProfileLink[];

  // Professional Summary
  summary: string;

  // Skills
  skills: SkillGroup[];

  // Experience
  experience: Experience[];

  // Education
  education: Education[];

  // Projects
  projects: Project[];

  // Activities (extracurriculars)
  activities: Activity[];

  // Languages
  languages: Language[];

  // Certifications
  certifications: Certification[];

  // Upload info
  uploadedFileName?: string;
  uploadedFileType?: string;
  uploadedAt?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Convert UserProfile to ResumeJSON format for tailoring
 */
export function profileToResumeJSON(profile: UserProfile): ResumeJSON {
  return {
    header: {
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      links: [
        ...(profile.linkedinUrl ? [{ type: 'LinkedIn', url: profile.linkedinUrl }] : []),
        ...(profile.githubUrl ? [{ type: 'GitHub', url: profile.githubUrl }] : []),
        ...(profile.portfolioUrl ? [{ type: 'Portfolio', url: profile.portfolioUrl }] : []),
        ...profile.otherLinks,
      ],
    },
    summary: profile.summary,
    education: profile.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      location: edu.location,
      start: edu.start,
      end: edu.end,
      gpa: edu.gpa,
      honors: edu.honors,
      coursework: edu.coursework,
      studyAbroad: edu.studyAbroad,
    })),
    experience: profile.experience.map(exp => ({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      start: exp.start,
      end: exp.current ? 'Present' : exp.end,
      bullets: exp.bullets,
      technologies: exp.technologies,
    })),
    projects: profile.projects.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.technologies,
      url: proj.url,
      date: proj.date,
      achievement: proj.achievement,
    })),
    activities: (profile.activities || []).map(act => ({
      organization: act.organization,
      role: act.role,
      start: act.start,
      end: act.end,
      bullets: act.bullets,
    })),
    skills: {
      groups: profile.skills,
    },
    languages: profile.languages || [],
    certifications: profile.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      expiry: cert.expiry,
      url: cert.url,
    })),
  };
}

/**
 * Database row to UserProfile
 */
export function dbRowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    location: row.location || '',
    linkedinUrl: row.linkedin_url,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
    otherLinks: row.other_links || [],
    summary: row.summary || '',
    skills: row.skills || [],
    experience: row.experience || [],
    education: row.education || [],
    projects: row.projects || [],
    activities: row.activities || [],
    languages: row.languages || [],
    certifications: row.certifications || [],
    uploadedFileName: row.uploaded_file_name,
    uploadedFileType: row.uploaded_file_type,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * UserProfile to database row format
 */
export function profileToDbRow(profile: UserProfile) {
  return {
    full_name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    linkedin_url: profile.linkedinUrl,
    github_url: profile.githubUrl,
    portfolio_url: profile.portfolioUrl,
    other_links: profile.otherLinks,
    summary: profile.summary,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
    projects: profile.projects,
    activities: profile.activities || [],
    languages: profile.languages || [],
    certifications: profile.certifications,
    uploaded_file_name: profile.uploadedFileName,
    uploaded_file_type: profile.uploadedFileType,
    uploaded_at: profile.uploadedAt,
  };
}
