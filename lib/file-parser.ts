/**
 * File Parser
 * Extract text from PDF and DOCX files
 */

// @ts-ignore - pdf-parse types may not be available
import pdf from 'pdf-parse';
// @ts-ignore - mammoth types may not be available
import mammoth from 'mammoth';

export type SupportedFileType = 'pdf' | 'docx' | 'doc';

export interface ParsedFile {
  text: string;
  fileType: SupportedFileType;
  fileName: string;
}

/**
 * Detect file type from buffer magic bytes or extension
 */
export function detectFileType(buffer: Buffer, fileName: string): SupportedFileType | null {
  // Check magic bytes
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf';
  }
  
  // DOCX files are ZIP archives starting with PK
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    return 'docx';
  }
  
  // Fall back to extension
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'doc') return 'doc';
  
  return null;
}

/**
 * Parse PDF file and extract text
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure the file is a valid PDF.');
  }
}

/**
 * Parse DOCX file and extract text
 */
async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file. Please ensure the file is a valid Word document.');
  }
}

/**
 * Main file parser - detects type and extracts text
 */
export async function parseResumeFile(buffer: Buffer, fileName: string): Promise<ParsedFile> {
  const fileType = detectFileType(buffer, fileName);
  
  if (!fileType) {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
  
  let text: string;
  
  switch (fileType) {
    case 'pdf':
      text = await parsePDF(buffer);
      break;
    case 'docx':
    case 'doc':
      text = await parseDOCX(buffer);
      break;
    default:
      throw new Error('Unsupported file type');
  }
  
  // Clean up the text
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (!text || text.length < 50) {
    throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable text.');
  }
  
  return {
    text,
    fileType,
    fileName,
  };
}

