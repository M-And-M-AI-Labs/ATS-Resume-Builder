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

// Constants for consistent formatting
const FONT_NAME = 'Calibri';
const FONT_SIZE_NAME = 28; // 14pt
const FONT_SIZE_SECTION = 22; // 11pt
const FONT_SIZE_BODY = 20; // 10pt
const SECTION_SPACING = 200;
const ITEM_SPACING = 100;
const PAGE_WIDTH = 9026; // ~6.27 inches in twips for tab stops

export async function generateDOCX(resume: ResumeJSON): Promise<Buffer> {
  const children: Paragraph[] = [];

  // ===== HEADER =====
  // Name (centered, bold, larger font)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: resume.header.name.toUpperCase(),
          bold: true,
          size: FONT_SIZE_NAME,
          font: FONT_NAME,
        }),
      ],
    })
  );

  // Contact info (centered: Location | Phone | Email)
  const contactParts = [
    resume.header.location,
    resume.header.phone ? `P: ${resume.header.phone}` : '',
    resume.header.email,
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
  if (resume.header.links && resume.header.links.length > 0) {
    const linkParts = resume.header.links.map(link => `${link.type}: ${link.url}`);
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
  if (resume.education && resume.education.length > 0) {
    children.push(createSectionHeader('EDUCATION'));

    for (const edu of resume.education) {
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
  if (resume.experience && resume.experience.length > 0) {
    children.push(createSectionHeader('WORK EXPERIENCE'));

    for (const exp of resume.experience) {
      const dateText = `${exp.start} – ${exp.end}`;

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
  if (resume.projects && resume.projects.length > 0) {
    children.push(createSectionHeader('UNIVERSITY PROJECTS'));

    for (const project of resume.projects) {
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
  if (resume.activities && resume.activities.length > 0) {
    children.push(createSectionHeader('ACTIVITIES'));

    for (const activity of resume.activities) {
      // Organization | Role
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
    (resume.skills?.groups && resume.skills.groups.length > 0) ||
    (resume.languages && resume.languages.length > 0) ||
    (resume.certifications && resume.certifications.length > 0);

  if (hasAdditional) {
    children.push(createSectionHeader('ADDITIONAL'));

    // Technical Skills
    if (resume.skills?.groups && resume.skills.groups.length > 0) {
      for (const group of resume.skills.groups) {
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
    if (resume.languages && resume.languages.length > 0) {
      const langText = resume.languages
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
    if (resume.certifications && resume.certifications.length > 0) {
      const certText = resume.certifications
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
