import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksOAuth } from '@/lib/quickbooks/oauth';

export async function GET(request: NextRequest) {
  console.log('🧪 QuickBooks OAuth test endpoint called');
  
  try {
    // Test OAuth client initialization
    console.log('🔧 Testing OAuth client initialization...');
    const oauthClient = new QuickBooksOAuth();
    
    // Get configuration (without sensitive data)
    const config = oauthClient.getConfig();
    
    console.log('✅ OAuth client initialized successfully');
    console.log('📋 Configuration:', config);
    
    // Test authorization URL generation
    console.log('🔗 Testing authorization URL generation...');
    const testState = `test-${Date.now()}`;
    const authUrl = oauthClient.getAuthorizationUrl(testState);
    
    console.log('✅ Authorization URL generated successfully');
    
    // Check environment variables
    const envCheck = {
      QUICKBOOKS_CLIENT_ID: !!process.env.QUICKBOOKS_CLIENT_ID,
      QUICKBOOKS_CLIENT_SECRET: !!process.env.QUICKBOOKS_CLIENT_SECRET,
      QUICKBOOKS_REDIRECT_URI: !!process.env.QUICKBOOKS_REDIRECT_URI,
      QUICKBOOKS_ENVIRONMENT: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox'
    };
    
    console.log('🔍 Environment variables check:', envCheck);
    
    // Return test results
    return NextResponse.json(
      {
        success: true,
        message: 'QuickBooks OAuth setup test successful',
        data: {
          oauth_client_initialized: true,
          configuration: config,
          environment_variables: envCheck,
          test_auth_url: authUrl,
          test_state: testState,
          endpoints: {
            auth: '/api/quickbooks/auth',
            callback: '/api/quickbooks/callback',
            test: '/api/quickbooks/test'
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ QuickBooks OAuth test failed');
    console.error('❌ Error details:', error);
    
    // Check for specific error types
    let errorType = 'unknown';
    let suggestions: string[] = [];
    
    if (error instanceof Error) {
      if (error.message.includes('QUICKBOOKS_CLIENT_ID')) {
        errorType = 'missing_credentials';
        suggestions = [
          'Set QUICKBOOKS_CLIENT_ID environment variable',
          'Set QUICKBOOKS_CLIENT_SECRET environment variable',
          'Optionally set QUICKBOOKS_REDIRECT_URI (defaults to http://localhost:3000/api/quickbooks/callback)',
          'Optionally set QUICKBOOKS_ENVIRONMENT (defaults to sandbox)'
        ];
      } else if (error.message.includes('intuit-oauth')) {
        errorType = 'library_error';
        suggestions = [
          'Verify intuit-oauth library is installed: npm install intuit-oauth',
          'Check if library version is compatible'
        ];
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'QuickBooks OAuth test failed',
        error_type: errorType,
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestions,
        environment_check: {
          QUICKBOOKS_CLIENT_ID: !!process.env.QUICKBOOKS_CLIENT_ID,
          QUICKBOOKS_CLIENT_SECRET: !!process.env.QUICKBOOKS_CLIENT_SECRET,
          QUICKBOOKS_REDIRECT_URI: !!process.env.QUICKBOOKS_REDIRECT_URI,
          QUICKBOOKS_ENVIRONMENT: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox'
        },
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