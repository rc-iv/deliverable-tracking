import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksOAuth } from '@/lib/quickbooks/oauth';

export async function GET(request: NextRequest) {
  console.log('🔄 QuickBooks OAuth callback received');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from callback URL
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('📋 Callback parameters:', {
      code: code ? '***' : null,
      realmId,
      state,
      error,
      errorDescription
    });
    
    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error received:', error);
      console.error('❌ Error description:', errorDescription);
      
      return NextResponse.json(
        {
          success: false,
          error: 'OAuth authorization failed',
          details: {
            error,
            description: errorDescription
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Validate required parameters
    if (!code || !realmId) {
      console.error('❌ Missing required OAuth parameters');
      
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required OAuth parameters',
          details: {
            code: !!code,
            realmId: !!realmId
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Initialize OAuth client
    const oauthClient = new QuickBooksOAuth();
    
    // Exchange authorization code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    const tokens = await oauthClient.exchangeCodeForTokens(code, realmId);
    
    console.log('✅ OAuth tokens received successfully');
    console.log('📊 Token summary:', {
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      refresh_expires_in: tokens.x_refresh_token_expires_in,
      realmId: tokens.realmId,
      created_at: new Date(tokens.createdAt).toISOString()
    });
    
    // TODO: Store tokens securely (database, encrypted storage, etc.)
    // For now, we'll return them in the response for testing
    // In production, you should:
    // 1. Store tokens in a secure database
    // 2. Associate with user session
    // 3. Redirect to success page
    
    console.log('⚠️ TODO: Implement secure token storage');
    
    // Return success response with token info (excluding sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: 'QuickBooks authorization successful',
        data: {
          realmId: tokens.realmId,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          refresh_expires_in: tokens.x_refresh_token_expires_in,
          created_at: new Date(tokens.createdAt).toISOString(),
          state
        },
        // TODO: Remove in production - only for testing
        tokens: {
          access_token: tokens.access_token.substring(0, 20) + '...',
          refresh_token: tokens.refresh_token.substring(0, 20) + '...'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ QuickBooks OAuth callback failed');
    console.error('❌ Error details:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'OAuth callback processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 