import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleAccessToken } from '@/lib/google/tokens';
import { createResumeDoc } from '@/lib/google/docs';
import { ResumeJSON } from '@/types/resume';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body - receives the (possibly edited) resume directly
    const { resume } = await request.json() as { resume: ResumeJSON };
    if (!resume) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: 400 });
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google authentication required. Please sign out and sign in again.' },
        { status: 401 }
      );
    }

    // Create document title from resume name
    const title = `Resume - ${resume.header.name || 'Untitled'}`;

    // Create Google Doc
    const { docId, docUrl } = await createResumeDoc(accessToken, resume, title);

    return NextResponse.json({
      docId,
      docUrl,
      message: 'Resume exported to Google Docs successfully',
    });
  } catch (error) {
    console.error('Docs export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export to Google Docs' },
      { status: 500 }
    );
  }
}
