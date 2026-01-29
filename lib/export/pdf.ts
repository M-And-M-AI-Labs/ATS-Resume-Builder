/**
 * PDF Export
 * Generate ATS-friendly PDF from resume JSON using pdf-lib
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ResumeJSON } from '@/types/resume';

// Sanitize text for WinAnsi encoding (StandardFonts only support WinAnsi)
function sanitizeText(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, '-') // Various dashes to hyphen
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes to apostrophe
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes to straight quotes
    .replace(/\u2026/g, '...')        // Ellipsis to three dots
    .replace(/\u2022/g, '-')          // Bullet to hyphen
    .replace(/[\u00A0]/g, ' ');       // Non-breaking space to regular space
}

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

// Constants for consistent formatting
const FONT_SIZE_NAME = 18;
const FONT_SIZE_SECTION = 11;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_SMALL = 9;
const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const SECTION_SPACING = 20;

export async function generatePDF(resume: ResumeJSON): Promise<Buffer> {
  // Sanitize all text for WinAnsi encoding compatibility
  const r = sanitizeResume(resume);

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  const contentWidth = width - PAGE_MARGIN * 2;

  let y = height - PAGE_MARGIN;

  // Helper function to add new page if needed
  const checkNewPage = (neededSpace: number) => {
    if (y - neededSpace < PAGE_MARGIN) {
      page = pdfDoc.addPage([595, 842]);
      y = height - PAGE_MARGIN;
    }
  };

  // Helper to draw text and return new Y position
  const drawText = (
    text: string,
    x: number,
    fontSize: number,
    font: typeof helvetica,
    options?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }
  ) => {
    const maxWidth = options?.maxWidth || contentWidth;
    const align = options?.align || 'left';

    // Word wrap
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (const line of lines) {
      checkNewPage(LINE_HEIGHT);
      let textX = x;
      if (align === 'center') {
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        textX = x + (maxWidth - textWidth) / 2;
      } else if (align === 'right') {
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        textX = x + maxWidth - textWidth;
      }

      page.drawText(line, {
        x: textX,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  };

  // Helper for section header with underline
  const drawSectionHeader = (text: string) => {
    checkNewPage(SECTION_SPACING + LINE_HEIGHT);
    y -= 5; // Extra space before section

    page.drawText(text, {
      x: PAGE_MARGIN,
      y,
      size: FONT_SIZE_SECTION,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Underline
    page.drawLine({
      start: { x: PAGE_MARGIN, y: y - 3 },
      end: { x: width - PAGE_MARGIN, y: y - 3 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    y -= LINE_HEIGHT + 5;
  };

  // Helper for two-column line
  const drawTwoColumn = (leftText: string, rightText: string, bold: boolean = false) => {
    checkNewPage(LINE_HEIGHT);
    const font = bold ? helveticaBold : helvetica;

    page.drawText(leftText, {
      x: PAGE_MARGIN,
      y,
      size: FONT_SIZE_BODY,
      font,
      color: rgb(0, 0, 0),
    });

    const rightWidth = font.widthOfTextAtSize(rightText, FONT_SIZE_BODY);
    page.drawText(rightText, {
      x: width - PAGE_MARGIN - rightWidth,
      y,
      size: FONT_SIZE_BODY,
      font,
      color: rgb(0, 0, 0),
    });

    y -= LINE_HEIGHT;
  };

  // Helper for bullet point
  const drawBullet = (text: string) => {
    const bulletIndent = 15;
    checkNewPage(LINE_HEIGHT);

    page.drawText('•', {
      x: PAGE_MARGIN,
      y,
      size: FONT_SIZE_BODY,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    // Word wrap the bullet text
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = contentWidth - bulletIndent;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = helvetica.widthOfTextAtSize(testLine, FONT_SIZE_BODY);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        checkNewPage(LINE_HEIGHT);
      }
      page.drawText(lines[i], {
        x: PAGE_MARGIN + bulletIndent,
        y,
        size: FONT_SIZE_BODY,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  };

  // ===== HEADER =====
  // Name (centered)
  const nameWidth = helveticaBold.widthOfTextAtSize(r.header.name.toUpperCase(), FONT_SIZE_NAME);
  page.drawText(r.header.name.toUpperCase(), {
    x: (width - nameWidth) / 2,
    y,
    size: FONT_SIZE_NAME,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT + 8;

  // Contact info (centered)
  const contactParts = [
    r.header.location,
    r.header.phone,
    r.header.email,
  ].filter(Boolean);
  const contactText = contactParts.join('  |  ');
  const contactWidth = helvetica.widthOfTextAtSize(contactText, FONT_SIZE_BODY);
  page.drawText(contactText, {
    x: (width - contactWidth) / 2,
    y,
    size: FONT_SIZE_BODY,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT;

  // Links
  if (r.header.links && r.header.links.length > 0) {
    const linkText = r.header.links.map((l) => `${l.type}: ${l.url}`).join('  |  ');
    const linkWidth = helvetica.widthOfTextAtSize(linkText, FONT_SIZE_SMALL);
    if (linkWidth < contentWidth) {
      page.drawText(linkText, {
        x: (width - linkWidth) / 2,
        y,
        size: FONT_SIZE_SMALL,
        font: helvetica,
        color: rgb(0, 0, 0.8),
      });
    }
    y -= LINE_HEIGHT;
  }

  y -= SECTION_SPACING;

  // ===== EDUCATION =====
  if (r.education && r.education.length > 0) {
    drawSectionHeader('EDUCATION');

    for (const edu of r.education) {
      const leftText = `${edu.institution}${edu.location ? `, ${edu.location}` : ''}`;
      const rightText = `${edu.degree}${edu.field ? `, ${edu.field}` : ''}${edu.end ? ` (${edu.end})` : ''}`;
      drawTwoColumn(leftText, rightText, true);

      if (edu.gpa || edu.honors) {
        const details = [edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors || '']
          .filter(Boolean)
          .join('; ');
        drawText(details, PAGE_MARGIN, FONT_SIZE_BODY, helvetica);
      }

      if (edu.coursework && edu.coursework.length > 0) {
        checkNewPage(LINE_HEIGHT);
        page.drawText('Relevant Coursework: ', {
          x: PAGE_MARGIN,
          y,
          size: FONT_SIZE_BODY,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        const cwX = PAGE_MARGIN + helveticaBold.widthOfTextAtSize('Relevant Coursework: ', FONT_SIZE_BODY);
        page.drawText(edu.coursework.join(', '), {
          x: cwX,
          y,
          size: FONT_SIZE_BODY,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
        y -= LINE_HEIGHT;
      }

      y -= 5;
    }
  }

  // ===== WORK EXPERIENCE =====
  if (r.experience && r.experience.length > 0) {
    drawSectionHeader('WORK EXPERIENCE');

    for (const exp of r.experience) {
      const leftText = `${exp.company}${exp.location ? `, ${exp.location}` : ''}`;
      const rightText = `${exp.title} (${exp.start} – ${exp.end})`;
      drawTwoColumn(leftText, rightText, true);

      for (const bullet of exp.bullets) {
        drawBullet(bullet);
      }

      y -= 5;
    }
  }

  // ===== PROJECTS =====
  if (r.projects && r.projects.length > 0) {
    drawSectionHeader('PROJECTS');

    for (const project of r.projects) {
      const projectTitle = project.date ? `${project.name} (${project.date})` : project.name;
      checkNewPage(LINE_HEIGHT);
      page.drawText(projectTitle, {
        x: PAGE_MARGIN,
        y,
        size: FONT_SIZE_BODY,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;

      const descParts = [project.description];
      if (project.achievement) descParts.push(project.achievement);
      drawBullet(descParts.join('; '));

      if (project.technologies && project.technologies.length > 0) {
        drawBullet(`Technologies: ${project.technologies.join(', ')}`);
      }

      y -= 5;
    }
  }

  // ===== ACTIVITIES =====
  if (r.activities && r.activities.length > 0) {
    drawSectionHeader('ACTIVITIES');

    for (const activity of r.activities) {
      const dateText = activity.start && activity.end
        ? `${activity.start} – ${activity.end}`
        : activity.end || '';
      const rightText = dateText ? `${activity.role} (${dateText})` : activity.role;
      drawTwoColumn(activity.organization, rightText, true);

      for (const bullet of activity.bullets) {
        drawBullet(bullet);
      }

      y -= 5;
    }
  }

  // ===== ADDITIONAL =====
  const hasAdditional =
    (r.skills?.groups && r.skills.groups.length > 0) ||
    (r.languages && r.languages.length > 0) ||
    (r.certifications && r.certifications.length > 0);

  if (hasAdditional) {
    drawSectionHeader('ADDITIONAL');

    // Skills
    if (r.skills?.groups && r.skills.groups.length > 0) {
      for (const group of r.skills.groups) {
        checkNewPage(LINE_HEIGHT);
        page.drawText(`${group.name}: `, {
          x: PAGE_MARGIN,
          y,
          size: FONT_SIZE_BODY,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        const labelWidth = helveticaBold.widthOfTextAtSize(`${group.name}: `, FONT_SIZE_BODY);
        page.drawText(group.items.join(', '), {
          x: PAGE_MARGIN + labelWidth,
          y,
          size: FONT_SIZE_BODY,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
        y -= LINE_HEIGHT;
      }
    }

    // Languages
    if (r.languages && r.languages.length > 0) {
      checkNewPage(LINE_HEIGHT);
      const langText = r.languages.map((l) => `${l.name} (${l.proficiency})`).join(', ');
      page.drawText('Languages: ', {
        x: PAGE_MARGIN,
        y,
        size: FONT_SIZE_BODY,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      const labelWidth = helveticaBold.widthOfTextAtSize('Languages: ', FONT_SIZE_BODY);
      page.drawText(langText, {
        x: PAGE_MARGIN + labelWidth,
        y,
        size: FONT_SIZE_BODY,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }

    // Certifications
    if (r.certifications && r.certifications.length > 0) {
      checkNewPage(LINE_HEIGHT);
      const certText = r.certifications
        .map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`)
        .join(', ');
      page.drawText('Certifications: ', {
        x: PAGE_MARGIN,
        y,
        size: FONT_SIZE_BODY,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      const labelWidth = helveticaBold.widthOfTextAtSize('Certifications: ', FONT_SIZE_BODY);
      page.drawText(certText, {
        x: PAGE_MARGIN + labelWidth,
        y,
        size: FONT_SIZE_BODY,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
