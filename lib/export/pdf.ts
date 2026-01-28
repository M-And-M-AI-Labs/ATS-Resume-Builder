/**
 * PDF Export
 * Generate ATS-friendly PDF from resume JSON using pdf-lib
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ResumeJSON } from '@/types/resume';

// Constants for consistent formatting
const FONT_SIZE_NAME = 18;
const FONT_SIZE_SECTION = 11;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_SMALL = 9;
const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const SECTION_SPACING = 20;

export async function generatePDF(resume: ResumeJSON): Promise<Buffer> {
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
  const nameWidth = helveticaBold.widthOfTextAtSize(resume.header.name.toUpperCase(), FONT_SIZE_NAME);
  page.drawText(resume.header.name.toUpperCase(), {
    x: (width - nameWidth) / 2,
    y,
    size: FONT_SIZE_NAME,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT + 8;

  // Contact info (centered)
  const contactParts = [
    resume.header.location,
    resume.header.phone,
    resume.header.email,
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
  if (resume.header.links && resume.header.links.length > 0) {
    const linkText = resume.header.links.map((l) => `${l.type}: ${l.url}`).join('  |  ');
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
  if (resume.education && resume.education.length > 0) {
    drawSectionHeader('EDUCATION');

    for (const edu of resume.education) {
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
  if (resume.experience && resume.experience.length > 0) {
    drawSectionHeader('WORK EXPERIENCE');

    for (const exp of resume.experience) {
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
  if (resume.projects && resume.projects.length > 0) {
    drawSectionHeader('PROJECTS');

    for (const project of resume.projects) {
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
  if (resume.activities && resume.activities.length > 0) {
    drawSectionHeader('ACTIVITIES');

    for (const activity of resume.activities) {
      drawTwoColumn(activity.organization, activity.role, true);

      for (const bullet of activity.bullets) {
        drawBullet(bullet);
      }

      y -= 5;
    }
  }

  // ===== ADDITIONAL =====
  const hasAdditional =
    (resume.skills?.groups && resume.skills.groups.length > 0) ||
    (resume.languages && resume.languages.length > 0) ||
    (resume.certifications && resume.certifications.length > 0);

  if (hasAdditional) {
    drawSectionHeader('ADDITIONAL');

    // Skills
    if (resume.skills?.groups && resume.skills.groups.length > 0) {
      for (const group of resume.skills.groups) {
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
    if (resume.languages && resume.languages.length > 0) {
      checkNewPage(LINE_HEIGHT);
      const langText = resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(', ');
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
    if (resume.certifications && resume.certifications.length > 0) {
      checkNewPage(LINE_HEIGHT);
      const certText = resume.certifications
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
