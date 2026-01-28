/**
 * Job Description Extractor
 * Fetches and extracts readable content from job posting URLs
 */

import { JSDOM } from 'jsdom';

export async function extractJobDescription(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    
    // Remove script and style elements
    const scripts = dom.window.document.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());

    // Try to find main content areas
    const mainContent = dom.window.document.querySelector('main, article, [role="main"], .content, .job-description, #job-description') 
      || dom.window.document.body;

    // Extract text content
    const textContent = mainContent?.textContent || dom.window.document.body?.textContent || '';
    
    // Clean up whitespace
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('Error extracting job description:', error);
    throw new Error(`Failed to extract job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

