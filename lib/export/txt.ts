/**
 * TXT Export
 * Generate plain text resume from JSON
 * Format based on Resume Worded template
 */

import { ResumeJSON } from '@/types/resume';

export function generateTXT(resume: ResumeJSON): string {
  const lines: string[] = [];

  // ===== HEADER =====
  lines.push(resume.header.name.toUpperCase());

  // Contact info
  const contactParts = [
    resume.header.location,
    resume.header.phone ? `P: ${resume.header.phone}` : '',
    resume.header.email,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    lines.push(contactParts.join(' | '));
  }

  if (resume.header.links && resume.header.links.length > 0) {
    const linkParts = resume.header.links.map(link => `${link.type}: ${link.url}`);
    lines.push(linkParts.join(' | '));
  }

  lines.push('');

  // ===== EDUCATION =====
  if (resume.education && resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('-'.repeat(60));

    for (const edu of resume.education) {
      const degreeText = `${edu.degree}${edu.field ? `, ${edu.field}` : ''}`;
      const dateText = edu.end ? (edu.start ? `${edu.start} - ${edu.end}` : edu.end) : '';

      lines.push(`${edu.institution}${edu.location ? `, ${edu.location}` : ''}`);
      lines.push(`${degreeText}${dateText ? `, ${dateText}` : ''}`);

      if (edu.gpa || edu.honors) {
        const gpaHonors = [
          edu.gpa ? `GPA: ${edu.gpa}` : '',
          edu.honors || '',
        ].filter(Boolean).join('; ');
        lines.push(gpaHonors);
      }

      if (edu.coursework && edu.coursework.length > 0) {
        lines.push(`Relevant Coursework: ${edu.coursework.join(', ')}`);
      }

      if (edu.studyAbroad) {
        lines.push('');
        lines.push(`${edu.studyAbroad.institution}, ${edu.studyAbroad.location}`);
        lines.push(`${edu.studyAbroad.program} (${edu.studyAbroad.start} - ${edu.studyAbroad.end})`);
      }

      lines.push('');
    }
  }

  // ===== WORK EXPERIENCE =====
  if (resume.experience && resume.experience.length > 0) {
    lines.push('WORK EXPERIENCE');
    lines.push('-'.repeat(60));

    for (const exp of resume.experience) {
      const dateText = `${exp.start} - ${exp.end}`;

      lines.push(`${exp.company}${exp.location ? `, ${exp.location}` : ''}`);
      lines.push(`${exp.title} (${dateText})`);
      lines.push('');

      for (const bullet of exp.bullets) {
        lines.push(`  • ${bullet}`);
      }

      lines.push('');
    }
  }

  // ===== UNIVERSITY PROJECTS =====
  if (resume.projects && resume.projects.length > 0) {
    lines.push('UNIVERSITY PROJECTS');
    lines.push('-'.repeat(60));

    for (const project of resume.projects) {
      const projectTitle = project.date
        ? `${project.name} (${project.date})`
        : project.name;

      lines.push(projectTitle);

      const descParts = [project.description];
      if (project.achievement) {
        descParts.push(project.achievement);
      }
      lines.push(`  • ${descParts.join('; ')}`);

      if (project.technologies && project.technologies.length > 0) {
        lines.push(`  • Technologies: ${project.technologies.join(', ')}`);
      }

      if (project.url) {
        lines.push(`  • URL: ${project.url}`);
      }

      lines.push('');
    }
  }

  // ===== ACTIVITIES =====
  if (resume.activities && resume.activities.length > 0) {
    lines.push('ACTIVITIES');
    lines.push('-'.repeat(60));

    for (const activity of resume.activities) {
      lines.push(`${activity.organization} | ${activity.role}`);

      for (const bullet of activity.bullets) {
        lines.push(`  • ${bullet}`);
      }

      lines.push('');
    }
  }

  // ===== ADDITIONAL =====
  const hasAdditional =
    (resume.skills?.groups && resume.skills.groups.length > 0) ||
    (resume.languages && resume.languages.length > 0) ||
    (resume.certifications && resume.certifications.length > 0);

  if (hasAdditional) {
    lines.push('ADDITIONAL');
    lines.push('-'.repeat(60));

    // Technical Skills
    if (resume.skills?.groups && resume.skills.groups.length > 0) {
      for (const group of resume.skills.groups) {
        lines.push(`${group.name}: ${group.items.join(', ')}`);
      }
    }

    // Languages
    if (resume.languages && resume.languages.length > 0) {
      const langText = resume.languages
        .map(lang => `${lang.name} (${lang.proficiency})`)
        .join(', ');
      lines.push(`Languages: ${langText}`);
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      const certText = resume.certifications
        .map(cert => `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`)
        .join(', ');
      lines.push(`Certifications: ${certText}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
