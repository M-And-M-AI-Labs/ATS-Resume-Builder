/**
 * POST /api/job/from-text
 * Process job description text directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const { jdText } = body;

    if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job description text is required (minimum 50 characters)' },
        { status: 400 }
      );
    }

    // Extract requirements using LLM
    const llm = getLLMAdapter();
    const requirements = await llm.extractJobRequirements(jdText);

    // Try to extract job title and company from the JD text
    const jobTitle = requirements.roleCategory || 'Software Engineer';
    const company = 'Unknown Company'; // We can improve this with LLM

    // Save job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        job_url: 'manual-entry',
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
    console.error('Error processing job description:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

