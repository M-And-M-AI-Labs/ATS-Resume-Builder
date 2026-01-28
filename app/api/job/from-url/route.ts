/**
 * POST /api/job/from-url
 * Extract job description from URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractJobDescription } from '@/lib/job-extractor';
import { getLLMAdapter } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobUrl } = body;

    if (!jobUrl || typeof jobUrl !== 'string') {
      return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });
    }

    // Extract job description text
    const jdText = await extractJobDescription(jobUrl);

    // Extract requirements using LLM
    const llm = getLLMAdapter();
    const requirements = await llm.extractJobRequirements(jdText);

    // Extract job title and company from URL or JD
    const urlParts = new URL(jobUrl);
    const jobTitle = requirements.roleCategory || 'Software Engineer';
    const company = urlParts.hostname.replace('www.', '').split('.')[0];

    // Save job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        job_url: jobUrl,
        job_title: jobTitle,
        company: company,
        jd_text: jdText,
        extracted_requirements_json: requirements,
      })
      .select('id, job_title, company, extracted_requirements_json')
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: job.id,
      jobTitle: job.job_title,
      company: job.company,
      requirements: job.extracted_requirements_json,
    });
  } catch (error) {
    console.error('Error extracting job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

