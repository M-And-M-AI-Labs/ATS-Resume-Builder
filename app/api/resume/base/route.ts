/**
 * POST /api/resume/base
 * Create or update base resume
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
    const { rawText } = body;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    // Parse resume using LLM
    const llm = getLLMAdapter();
    const parsedResume = await llm.parseResume(rawText);

    // Check if user has existing base resume
    const { data: existing } = await supabase
      .from('base_resumes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let resumeId: string;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('base_resumes')
        .update({
          raw_text: rawText,
          parsed_resume_json: parsedResume,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) throw error;
      resumeId = data.id;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('base_resumes')
        .insert({
          user_id: user.id,
          raw_text: rawText,
          parsed_resume_json: parsedResume,
        })
        .select('id')
        .single();

      if (error) throw error;
      resumeId = data.id;
    }

    return NextResponse.json({
      id: resumeId,
      parsedResume,
    });
  } catch (error) {
    console.error('Error creating base resume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

