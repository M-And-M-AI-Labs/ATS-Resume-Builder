/**
 * DOCX Export
 * Generate ATS-friendly DOCX from resume JSON
 * Format based on Resume Worded template
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
} from 'docx';
import { ResumeJSON } from '@/types/resume';

// Sanitize text for WinAnsi encoding (replace problematic Unicode characters)
function sanitizeText(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, '-') // Various dashes to hyphen
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes to apostrophe
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes to straight quotes
    .replace(/\u2026/g, '...')        // Ellipsis to three dots
    .replace(/\u2022/g, '-')          // Bullet to hyphen (we use Word bullets)
    .replace(/[\u00A0]/g, ' ');       // Non-breaking space to regular space
}

// Constants for consistent formatting
const FONT_NAME = 'Calibri';
const FONT_SIZE_NAME = 28; // 14pt
const FONT_SIZE_SECTION = 22; // 11pt
const FONT_SIZE_BODY = 20; // 10pt
const SECTION_SPACING = 200;
const ITEM_SPACING = 100;
const PAGE_WIDTH = 9026; // ~6.27 inches in twips for tab stops

// Deep sanitize all string values in an object
function sanitizeResume(resume: ResumeJSON): ResumeJSON {
  const sanitizeValue = (val: any): any => {
    if (typeof val === 'string') return sanitizeText(val);
    if (Array.isArray(val)) return val.map(sanitizeValue);
    if (val && typeof val === 'object') {
      const result: any = {};
      for (const key of Object.keys(val)) {
        result[key] = sanitizeValue(val[key]);
      }
      return result;
    }
    return val;
  };
  return sanitizeValue(resume) as ResumeJSON;
}

export async function generateDOCX(resume: ResumeJSON): Promise<Buffer> {
  // Sanitize all text in the resume to ensure WinAnsi compatibility
  const sanitizedResume = sanitizeResume(resume);
  const children: Paragraph[] = [];

  // ===== HEADER =====
  // Name (centered, bold, larger font)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: sanitizedResume.header.name.toUpperCase(),
          bold: true,
          size: FONT_SIZE_NAME,
          font: FONT_NAME,
        }),
      ],
    })
  );

  // Contact info (centered: Location | Phone | Email)
  const contactParts = [
    sanitizedResume.header.location,
    sanitizedResume.header.phone ? `P: ${sanitizedResume.header.phone}` : '',
    sanitizedResume.header.email,
  ].filter(Boolean);

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: SECTION_SPACING },
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: FONT_SIZE_BODY,
          font: FONT_NAME,
        }),
      ],
    })
  );

  // Links (if any)
  if (sanitizedResume.header.links && sanitizedResume.header.links.length > 0) {
    const linkParts = sanitizedResume.header.links.map(link => `${link.type}: ${link.url}`);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: SECTION_SPACING },
        children: [
          new TextRun({
            text: linkParts.join(' | '),
            size: FONT_SIZE_BODY,
            font: FONT_NAME,
          }),
        ],
      })
    );
  }

  // ===== EDUCATION =====
  if (sanitizedResume.education && sanitizedResume.education.length > 0) {
    children.push(createSectionHeader('EDUCATION'));

    for (const edu of sanitizedResume.education) {
      // Institution and Location | Degree (Date)
      const degreeText = `${edu.degree}${edu.field ? `, ${edu.field}` : ''}`;
      const dateText = edu.end ? (edu.start ? `${edu.start} - ${edu.end}` : edu.end) : '';

      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH }],
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${edu.institution}`,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: edu.location ? `, ${edu.location}` : '',
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: degreeText,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: dateText ? `, ${dateText}` : '',
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
          ],
        })
      );

      // Major/Minor if field is specified separately
      if (edu.field) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `Major: ${edu.field}`,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }

      // GPA and Honors
      if (edu.gpa || edu.honors) {
        const gpaHonors = [
          edu.gpa ? `GPA: ${edu.gpa}` : '',
          edu.honors || '',
        ].filter(Boolean).join('; ');

        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: gpaHonors,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }

      // Relevant Coursework
      if (edu.coursework && edu.coursework.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'Relevant Coursework: ',
                bold: true,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
              new TextRun({
                text: edu.coursework.join(', '),
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }

      // Study Abroad
      if (edu.studyAbroad) {
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH }],
            spacing: { after: 40, before: 80 },
            children: [
              new TextRun({
                text: edu.studyAbroad.institution,
                bold: true,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
              new TextRun({
                text: `, ${edu.studyAbroad.location}`,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
              new TextRun({
                text: '\t',
              }),
              new TextRun({
                text: `${edu.studyAbroad.program} (${edu.studyAbroad.start} - ${edu.studyAbroad.end})`,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }
    }

    children.push(new Paragraph({ spacing: { after: ITEM_SPACING } }));
  }

  // ===== WORK EXPERIENCE =====
  if (sanitizedResume.experience && sanitizedResume.experience.length > 0) {
    children.push(createSectionHeader('WORK EXPERIENCE'));

    for (const exp of sanitizedResume.experience) {
      const dateText = `${exp.start} - ${exp.end}`;

      // Company, Location | Title (Date)
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH }],
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: exp.company,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: exp.location ? `, ${exp.location}` : '',
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: exp.title,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: ` (${dateText})`,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
          ],
        })
      );

      // Bullets
      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }

      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // ===== UNIVERSITY PROJECTS =====
  if (sanitizedResume.projects && sanitizedResume.projects.length > 0) {
    children.push(createSectionHeader('UNIVERSITY PROJECTS'));

    for (const project of sanitizedResume.projects) {
      // Project Name (Date) | Achievement
      const projectLine: TextRun[] = [
        new TextRun({
          text: project.name,
          bold: true,
          size: FONT_SIZE_BODY,
          font: FONT_NAME,
        }),
      ];

      if (project.date) {
        projectLine.push(
          new TextRun({
            text: ` (${project.date})`,
            size: FONT_SIZE_BODY,
            font: FONT_NAME,
          })
        );
      }

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: projectLine,
        })
      );

      // Description with achievement
      const descParts = [project.description];
      if (project.achievement) {
        descParts.push(project.achievement);
      }

      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: descParts.join('; '),
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
          ],
        })
      );

      // Technologies
      if (project.technologies && project.technologies.length > 0) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `Technologies: ${project.technologies.join(', ')}`,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }
    }
  }

  // ===== ACTIVITIES =====
  if (sanitizedResume.activities && sanitizedResume.activities.length > 0) {
    children.push(createSectionHeader('ACTIVITIES'));

    for (const activity of sanitizedResume.activities) {
      // Organization | Role (Date)
      const dateText = activity.start && activity.end
        ? `${activity.start} - ${activity.end}`
        : activity.end || '';

      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH }],
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: activity.organization,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: activity.role,
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            ...(dateText ? [
              new TextRun({
                text: ` (${dateText})`,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ] : []),
          ],
        })
      );

      // Bullets
      for (const bullet of activity.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }

      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // ===== ADDITIONAL =====
  const hasAdditional =
    (sanitizedResume.skills?.groups && sanitizedResume.skills.groups.length > 0) ||
    (sanitizedResume.languages && sanitizedResume.languages.length > 0) ||
    (sanitizedResume.certifications && sanitizedResume.certifications.length > 0);

  if (hasAdditional) {
    children.push(createSectionHeader('ADDITIONAL'));

    // Technical Skills
    if (sanitizedResume.skills?.groups && sanitizedResume.skills.groups.length > 0) {
      for (const group of sanitizedResume.skills.groups) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${group.name}: `,
                bold: true,
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
              new TextRun({
                text: group.items.join(', '),
                size: FONT_SIZE_BODY,
                font: FONT_NAME,
              }),
            ],
          })
        );
      }
    }

    // Languages
    if (sanitizedResume.languages && sanitizedResume.languages.length > 0) {
      const langText = sanitizedResume.languages
        .map(lang => `${lang.name} (${lang.proficiency})`)
        .join(', ');

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: langText,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
          ],
        })
      );
    }

    // Certifications
    if (sanitizedResume.certifications && sanitizedResume.certifications.length > 0) {
      const certText = sanitizedResume.certifications
        .map(cert => `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`)
        .join(', ');

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
            new TextRun({
              text: certText,
              size: FONT_SIZE_BODY,
              font: FONT_NAME,
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Helper to create section headers with underline
function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 80 },
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22, // 11pt
        font: 'Calibri',
      }),
    ],
  });
}
