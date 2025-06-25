import { NextRequest, NextResponse } from 'next/server';
import { getAsanaOAuthUrl } from '@/lib/asana/config';

export async function GET(request: NextRequest) {
  try {
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build the OAuth URL
    const oauthUrl = getAsanaOAuthUrl(state);
    
    // Store the state in a cookie for verification in callback
    const response = NextResponse.redirect(oauthUrl);
    response.cookies.set('asana_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Asana OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Asana OAuth flow' },
      { status: 500 }
    );
  }
}
