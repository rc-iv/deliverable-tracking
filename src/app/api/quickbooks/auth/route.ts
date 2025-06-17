import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksOAuth } from '@/lib/quickbooks/oauth';

export async function GET(request: NextRequest) {
  console.log('🔐 QuickBooks OAuth authentication request received');
  
  try {
    // Initialize OAuth client
    const oauthClient = new QuickBooksOAuth();
    
    // Get state parameter from query string (optional)
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || `qb-auth-${Date.now()}`;
    
    console.log('🔗 Generating authorization URL with state:', state);
    
    // Generate authorization URL
    const authUrl = oauthClient.getAuthorizationUrl(state);
    
    console.log('✅ Redirecting to QuickBooks authorization');
    console.log('🔗 Auth URL:', authUrl);
    
    // Redirect to QuickBooks authorization page
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('❌ QuickBooks OAuth initialization failed');
    console.error('❌ Error details:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize QuickBooks OAuth',
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