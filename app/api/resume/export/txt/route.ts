/**
 * POST /api/resume/export/txt
 * Export tailored resume as TXT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTXT } from '@/lib/export/txt';
import { recordUsageEvent } from '@/lib/usage-limits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tailoredResumeId } = body;

    if (!tailoredResumeId) {
      return NextResponse.json({ error: 'tailoredResumeId is required' }, { status: 400 });
    }

    // Fetch tailored resume
    const { data: tailoredResume, error } = await supabase
      .from('tailored_resumes')
      .select('tailored_resume_json')
      .eq('id', tailoredResumeId)
      .eq('user_id', user.id)
      .single();

    if (error || !tailoredResume) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    // Generate TXT
    const txtContent = generateTXT(tailoredResume.tailored_resume_json);

    // Record usage
    await recordUsageEvent(user.id, 'export_txt', 'txt');

    return NextResponse.json({
      txt: txtContent,
    });
  } catch (error) {
    console.error('Error exporting TXT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

