/**
 * POST /api/resume/export/docx
 * Export tailored resume as DOCX
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDOCX } from '@/lib/export/docx';
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
      .select('tailored_resume_json, docx_url')
      .eq('id', tailoredResumeId)
      .eq('user_id', user.id)
      .single();

    if (error || !tailoredResume) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    // Generate DOCX
    const docxBuffer = await generateDOCX(tailoredResume.tailored_resume_json);

    // TODO: Upload to Supabase Storage and update docx_url
    // For now, return as base64 or blob URL
    const base64 = docxBuffer.toString('base64');

    // Record usage
    await recordUsageEvent(user.id, 'export_docx', 'docx');

    return NextResponse.json({
      docx: base64,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  } catch (error) {
    console.error('Error exporting DOCX:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

