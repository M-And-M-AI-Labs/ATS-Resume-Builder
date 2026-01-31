import { ResumeJSON } from '@/types/resume';

const DOCS_API_BASE = 'https://docs.googleapis.com/v1/documents';

interface DocRequest {
  insertText?: {
    location: { index: number };
    text: string;
  };
  updateParagraphStyle?: {
    range: { startIndex: number; endIndex: number };
    paragraphStyle: {
      namedStyleType?: string;
      alignment?: string;
      spaceAbove?: { magnitude: number; unit: string };
      spaceBelow?: { magnitude: number; unit: string };
    };
    fields: string;
  };
  updateTextStyle?: {
    range: { startIndex: number; endIndex: number };
    textStyle: {
      bold?: boolean;
      fontSize?: { magnitude: number; unit: string };
    };
    fields: string;
  };
}

/**
 * Create a formatted Google Doc from ResumeJSON.
 */
export async function createResumeDoc(
  accessToken: string,
  resume: ResumeJSON,
  title: string
): Promise<{ docId: string; docUrl: string }> {
  // Create empty document
  const createResponse = await fetch(DOCS_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create document: ${error}`);
  }

  const doc = await createResponse.json();
  const docId = doc.documentId;

  // Build document content
  const content = buildResumeContent(resume);

  // Insert content and apply formatting
  const requests = buildDocRequests(content);

  if (requests.length > 0) {
    const updateResponse = await fetch(`${DOCS_API_BASE}/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update document: ${error}`);
    }
  }

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
}

interface ContentBlock {
  text: string;
  style: 'title' | 'heading' | 'subheading' | 'normal' | 'bullet';
  bold?: boolean;
}

function buildResumeContent(resume: ResumeJSON): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Header - Name
  blocks.push({ text: resume.header.name.toUpperCase(), style: 'title', bold: true });

  // Contact info
  const contactParts = [
    resume.header.location,
    resume.header.phone ? `P: ${resume.header.phone}` : null,
    resume.header.email,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    blocks.push({ text: contactParts.join(' | '), style: 'normal' });
  }

  // Links
  if (resume.header.links && resume.header.links.length > 0) {
    const linkText = resume.header.links.map(l => `${l.type}: ${l.url}`).join(' | ');
    blocks.push({ text: linkText, style: 'normal' });
  }

  // Summary
  if (resume.summary) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'SUMMARY', style: 'heading', bold: true });
    blocks.push({ text: resume.summary, style: 'normal' });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'EDUCATION', style: 'heading', bold: true });
    for (const edu of resume.education) {
      const line1 = `${edu.institution}${edu.location ? `, ${edu.location}` : ''}`;
      const line2 = `${edu.degree}${edu.field ? `, ${edu.field}` : ''}${edu.end ? ` (${edu.start ? `${edu.start} - ` : ''}${edu.end})` : ''}`;
      blocks.push({ text: line1, style: 'subheading', bold: true });
      blocks.push({ text: line2, style: 'normal' });
      if (edu.gpa || edu.honors) {
        blocks.push({ text: [edu.gpa ? `GPA: ${edu.gpa}` : null, edu.honors].filter(Boolean).join('; '), style: 'normal' });
      }
      if (edu.coursework && edu.coursework.length > 0) {
        blocks.push({ text: `Relevant Coursework: ${edu.coursework.join(', ')}`, style: 'normal' });
      }
    }
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'WORK EXPERIENCE', style: 'heading', bold: true });
    for (const exp of resume.experience) {
      const line1 = `${exp.company}${exp.location ? `, ${exp.location}` : ''}`;
      const line2 = `${exp.title} (${exp.start} - ${exp.end})`;
      blocks.push({ text: line1, style: 'subheading', bold: true });
      blocks.push({ text: line2, style: 'normal' });
      for (const bullet of exp.bullets) {
        blocks.push({ text: bullet, style: 'bullet' });
      }
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'PROJECTS', style: 'heading', bold: true });
    for (const proj of resume.projects) {
      const titleLine = `${proj.name}${proj.date ? ` (${proj.date})` : ''}`;
      blocks.push({ text: titleLine, style: 'subheading', bold: true });
      blocks.push({ text: proj.description, style: 'bullet' });
      if (proj.technologies && proj.technologies.length > 0) {
        blocks.push({ text: `Technologies: ${proj.technologies.join(', ')}`, style: 'bullet' });
      }
    }
  }

  // Activities
  if (resume.activities && resume.activities.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'ACTIVITIES', style: 'heading', bold: true });
    for (const act of resume.activities) {
      const datePart = act.start || act.end ? ` (${act.start ? `${act.start} - ` : ''}${act.end || 'Present'})` : '';
      blocks.push({ text: `${act.organization} - ${act.role}${datePart}`, style: 'subheading', bold: true });
      for (const bullet of act.bullets) {
        blocks.push({ text: bullet, style: 'bullet' });
      }
    }
  }

  // Skills
  if (resume.skills?.groups && resume.skills.groups.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'SKILLS', style: 'heading', bold: true });
    for (const group of resume.skills.groups) {
      blocks.push({ text: `${group.name}: ${group.items.join(', ')}`, style: 'normal' });
    }
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'LANGUAGES', style: 'heading', bold: true });
    const langText = resume.languages.map(l => `${l.name} (${l.proficiency})`).join(', ');
    blocks.push({ text: langText, style: 'normal' });
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    blocks.push({ text: '', style: 'normal' }); // spacing
    blocks.push({ text: 'CERTIFICATIONS', style: 'heading', bold: true });
    for (const cert of resume.certifications) {
      const certText = `${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`;
      blocks.push({ text: certText, style: 'normal' });
    }
  }

  return blocks;
}

function buildDocRequests(blocks: ContentBlock[]): DocRequest[] {
  const requests: DocRequest[] = [];
  let currentIndex = 1; // Google Docs starts at index 1

  // First, insert all text
  const fullText = blocks.map(b => {
    if (b.style === 'bullet') {
      return `• ${b.text}\n`;
    }
    return `${b.text}\n`;
  }).join('');

  if (fullText.trim()) {
    requests.push({
      insertText: {
        location: { index: 1 },
        text: fullText,
      },
    });

    // Now apply formatting to each block
    for (const block of blocks) {
      const textLength = block.style === 'bullet'
        ? block.text.length + 3 // "• " + text + "\n"
        : block.text.length + 1; // text + "\n"

      const endIndex = currentIndex + textLength;

      // Apply paragraph style
      if (block.style === 'title') {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: currentIndex, endIndex },
            paragraphStyle: {
              alignment: 'CENTER',
              spaceBelow: { magnitude: 6, unit: 'PT' },
            },
            fields: 'alignment,spaceBelow',
          },
        });
        requests.push({
          updateTextStyle: {
            range: { startIndex: currentIndex, endIndex: endIndex - 1 },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 16, unit: 'PT' },
            },
            fields: 'bold,fontSize',
          },
        });
      } else if (block.style === 'heading') {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: currentIndex, endIndex },
            paragraphStyle: {
              spaceAbove: { magnitude: 12, unit: 'PT' },
              spaceBelow: { magnitude: 4, unit: 'PT' },
            },
            fields: 'spaceAbove,spaceBelow',
          },
        });
        requests.push({
          updateTextStyle: {
            range: { startIndex: currentIndex, endIndex: endIndex - 1 },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 11, unit: 'PT' },
            },
            fields: 'bold,fontSize',
          },
        });
      } else if (block.style === 'subheading' && block.bold) {
        requests.push({
          updateTextStyle: {
            range: { startIndex: currentIndex, endIndex: endIndex - 1 },
            textStyle: {
              bold: true,
            },
            fields: 'bold',
          },
        });
      }

      currentIndex = endIndex;
    }
  }

  return requests;
}
