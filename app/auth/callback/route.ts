import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Store Google OAuth tokens for Sheets API access
      const { provider_token, provider_refresh_token } = data.session;
      const userId = data.session.user.id;

      if (provider_token) {
        // Calculate token expiry (Google tokens typically last 1 hour)
        const tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString();

        // Store tokens in users table
        await supabase
          .from('users')
          .update({
            google_access_token: provider_token,
            google_refresh_token: provider_refresh_token || null,
            google_token_expiry: tokenExpiry,
          })
          .eq('id', userId);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
