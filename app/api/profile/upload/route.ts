/**
 * POST /api/profile/upload
 * Upload resume file (PDF/DOCX) and parse into profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseResumeFile } from '@/lib/file-parser';
import { getLLMAdapter } from '@/lib/llm';
import { profileToDbRow, dbRowToProfile } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF or Word document.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the file to extract text
    const parsedFile = await parseResumeFile(buffer, file.name);

    // Use LLM to extract structured profile data
    const llm = getLLMAdapter();
    const profileData = await llm.parseProfile(parsedFile.text);

    // Add upload metadata
    profileData.uploadedFileName = file.name;
    profileData.uploadedFileType = parsedFile.fileType;
    profileData.uploadedAt = new Date().toISOString();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let profile;

    const dbData = {
      user_id: user.id,
      ...profileToDbRow(profileData),
    };

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    return NextResponse.json({
      profile: dbRowToProfile(profile),
      message: 'Resume uploaded and parsed successfully',
      extractedText: parsedFile.text.substring(0, 500) + '...', // Preview of extracted text
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse resume' },
      { status: 500 }
    );
  }
}

