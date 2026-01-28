/**
 * Profile API Routes
 * GET /api/profile - Get user profile
 * POST /api/profile - Create profile
 * PUT /api/profile - Update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dbRowToProfile, profileToDbRow, UserProfile } from '@/types/profile';

// GET - Retrieve user profile
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!profile) {
      // Return empty profile structure
      return NextResponse.json({
        profile: null,
        exists: false,
      });
    }

    return NextResponse.json({
      profile: dbRowToProfile(profile),
      exists: true,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const profileData: UserProfile = body.profile;

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new profile
    const dbData = {
      user_id: user.id,
      ...profileToDbRow(profileData),
    };

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      profile: dbRowToProfile(profile),
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const profileData: UserProfile = body.profile;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let profile;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileToDbRow(profileData))
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Create new (upsert behavior)
      const dbData = {
        user_id: user.id,
        ...profileToDbRow(profileData),
      };

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
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

