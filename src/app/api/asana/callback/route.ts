import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/asana/oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('Asana OAuth error:', error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/asana?error=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code) {
      console.error('Asana OAuth callback missing code parameter');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/asana?error=${encodeURIComponent('Missing authorization code')}`
      );
    }

    // Verify state parameter (optional but recommended for security)
    const storedState = request.cookies.get('asana_oauth_state')?.value;
    if (state && storedState && state !== storedState) {
      console.error('Asana OAuth state mismatch');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/asana?error=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Store tokens securely (in production, use database or secure session)
    // For now, we'll store in cookies for testing
    const response = NextResponse.redirect(`${request.nextUrl.origin}/asana?success=true`);
    
    // Store access token (in production, use secure session management)
    response.cookies.set('asana_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in, // Use token expiration time
    });

    if (tokenResponse.refresh_token) {
      response.cookies.set('asana_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Clear the OAuth state cookie
    response.cookies.delete('asana_oauth_state');

    return response;
  } catch (error) {
    console.error('Asana OAuth callback error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/asana?error=${encodeURIComponent('Failed to complete OAuth flow')}`
    );
  }
} 