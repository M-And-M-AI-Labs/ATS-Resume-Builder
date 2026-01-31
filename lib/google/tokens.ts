import { createClient } from '@/lib/supabase/server';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiry: Date | null;
}

/**
 * Get a valid Google access token for the user.
 * Refreshes the token if it's expired or about to expire.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Get current tokens from database
  const { data: user, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('Error fetching user tokens:', error);
    return null;
  }

  const { google_access_token, google_refresh_token, google_token_expiry } = user;

  if (!google_access_token) {
    return null;
  }

  // Check if token is still valid (with 5 minute buffer)
  const expiry = google_token_expiry ? new Date(google_token_expiry) : null;
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiry && expiry.getTime() - bufferMs > now.getTime()) {
    // Token is still valid
    return google_access_token;
  }

  // Token is expired or about to expire, try to refresh
  if (google_refresh_token) {
    const newTokens = await refreshGoogleToken(google_refresh_token);
    if (newTokens) {
      // Update tokens in database
      await supabase
        .from('users')
        .update({
          google_access_token: newTokens.accessToken,
          google_token_expiry: newTokens.expiry?.toISOString(),
        })
        .eq('id', userId);

      return newTokens.accessToken;
    }
  }

  // Could not refresh token
  return null;
}

/**
 * Refresh a Google access token using a refresh token.
 */
export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokens | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to refresh Google token:', errorData);
      return null;
    }

    const data: TokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiry: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

/**
 * Check if the user has valid Google tokens stored.
 */
export async function hasGoogleTokens(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  return !!(user.google_access_token || user.google_refresh_token);
}
