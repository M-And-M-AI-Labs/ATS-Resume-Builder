/**
 * POST /api/resume/export/pdf
 * Export tailored resume as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePDF } from '@/lib/export/pdf';
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
      .select('tailored_resume_json, pdf_url')
      .eq('id', tailoredResumeId)
      .eq('user_id', user.id)
      .single();

    if (error || !tailoredResume) {
      return NextResponse.json({ error: 'Tailored resume not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(tailoredResume.tailored_resume_json);

    // TODO: Upload to Supabase Storage and update pdf_url
    // For now, return as base64
    const base64 = pdfBuffer.toString('base64');

    // Record usage
    await recordUsageEvent(user.id, 'export_pdf', 'pdf');

    return NextResponse.json({
      pdf: base64,
      mimeType: 'application/pdf',
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
