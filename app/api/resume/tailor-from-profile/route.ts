/**
 * POST /api/resume/tailor-from-profile
 * Tailor resume from user profile to job requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLLMAdapter } from '@/lib/llm';
import { checkResumeGenerationLimit, incrementUsage, recordUsageEvent } from '@/lib/usage-limits';
import { dbRowToProfile, profileToResumeJSON } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, forceRegenerate } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Fetch user profile
    const { data: profileRow, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json(
        { error: 'Profile not found. Please create your profile first.' },
        { status: 404 }
      );
    }

    const profile = dbRowToProfile(profileRow);

    // Check if already tailored (unless force regenerate)
    const { data: existing } = await supabase
      .from('tailored_resumes')
      .select('id, tailored_resume_json, original_resume_json, ats_keyword_diff, ats_gap_report')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing && !forceRegenerate) {
      return NextResponse.json({
        id: existing.id,
        tailoredResume: existing.tailored_resume_json,
        originalResume: existing.original_resume_json,
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

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('extracted_requirements_json')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Convert profile to resume JSON format
    const baseResumeJSON = profileToResumeJSON(profile);

    // Tailor resume using LLM
    const llm = getLLMAdapter();
    const result = await llm.tailorResume(
      baseResumeJSON,
      job.extracted_requirements_json
    );

    // Save tailored resume (with profile_id reference and original for diff)
    const { data: tailoredResume, error: saveError } = await supabase
      .from('tailored_resumes')
      .insert({
        user_id: user.id,
        job_id: jobId,
        tailored_resume_json: result.tailoredResume,
        original_resume_json: baseResumeJSON,
        ats_keyword_diff: result.keywordDiff,
        ats_gap_report: result.gapReport,
      })
      .select('id')
      .single();

    if (saveError) throw saveError;

    // Increment usage
    await incrementUsage(user.id);

    // Record usage event
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
      originalResume: baseResumeJSON,
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

