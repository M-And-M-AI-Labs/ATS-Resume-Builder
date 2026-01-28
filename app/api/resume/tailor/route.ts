/**
 * POST /api/resume/tailor
 * Tailor resume to job requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLLMAdapter } from '@/lib/llm';
import { checkResumeGenerationLimit, incrementUsage, recordUsageEvent } from '@/lib/usage-limits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { baseResumeId, jobId, forceRegenerate } = body;

    if (!baseResumeId || !jobId) {
      return NextResponse.json(
        { error: 'baseResumeId and jobId are required' },
        { status: 400 }
      );
    }

    // Check if already tailored (unless force regenerate)
    const { data: existing } = await supabase
      .from('tailored_resumes')
      .select('id, tailored_resume_json, ats_keyword_diff, ats_gap_report')
      .eq('base_resume_id', baseResumeId)
      .eq('job_id', jobId)
      .single();

    if (existing && !forceRegenerate) {
      return NextResponse.json({
        id: existing.id,
        tailoredResume: existing.tailored_resume_json,
        keywordDiff: existing.ats_keyword_diff,
        gapReport: existing.ats_gap_report,
      });
    }

    // If force regenerate, delete the existing entry
    if (existing && forceRegenerate) {
      await supabase
        .from('tailored_resumes')
        .delete()
        .eq('id', existing.id);
    }

    // Check usage limits
    const usageCheck = await checkResumeGenerationLimit(user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason || 'Usage limit exceeded' },
        { status: 403 }
      );
    }

    // Fetch base resume and job
    const { data: baseResume, error: resumeError } = await supabase
      .from('base_resumes')
      .select('parsed_resume_json')
      .eq('id', baseResumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !baseResume) {
      return NextResponse.json({ error: 'Base resume not found' }, { status: 404 });
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('extracted_requirements_json')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Tailor resume using LLM
    const llm = getLLMAdapter();
    const result = await llm.tailorResume(
      baseResume.parsed_resume_json,
      job.extracted_requirements_json
    );

    // Save tailored resume
    const { data: tailoredResume, error: saveError } = await supabase
      .from('tailored_resumes')
      .insert({
        user_id: user.id,
        base_resume_id: baseResumeId,
        job_id: jobId,
        tailored_resume_json: result.tailoredResume,
        ats_keyword_diff: result.keywordDiff,
        ats_gap_report: result.gapReport,
      })
      .select('id')
      .single();

    if (saveError) throw saveError;

    // Increment usage
    await incrementUsage(user.id);

    // Record usage event (we don't have token counts from adapter yet)
    let modelName: string;
    if (process.env.LLM_PROVIDER === 'groq') {
      modelName = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    } else {
      modelName = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    }
    await recordUsageEvent(user.id, 'tailor_resume', modelName);

    return NextResponse.json({
      id: tailoredResume.id,
      tailoredResume: result.tailoredResume,
      keywordDiff: result.keywordDiff,
      gapReport: result.gapReport,
    });
  } catch (error) {
    console.error('Error tailoring resume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

