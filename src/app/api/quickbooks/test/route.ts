import { NextRequest, NextResponse } from 'next/server';
import { getQuickBooksConfigInfo, getCurrentQuickBooksApiBaseUrl, buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 QuickBooks Environment Test Endpoint');
    
    // Get configuration info
    const configInfo = getQuickBooksConfigInfo();
    const currentBaseUrl = getCurrentQuickBooksApiBaseUrl();
    
    // Test URL building
    const testRealmId = '123456789';
    const testInvoiceUrl = buildQuickBooksApiUrl('/invoice/123', testRealmId);
    const testQueryUrl = buildQuickBooksApiUrl('/query?query=SELECT * FROM Invoice', testRealmId);
    
    const response = {
      success: true,
      message: 'QuickBooks environment configuration test',
      timestamp: new Date().toISOString(),
      configuration: {
        ...configInfo,
        testUrls: {
          baseUrl: currentBaseUrl,
          invoiceUrl: testInvoiceUrl,
          queryUrl: testQueryUrl
        }
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        QUICKBOOKS_ENVIRONMENT: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox (default)',
        QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID ? '***configured***' : '***missing***',
        QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET ? '***configured***' : '***missing***',
        QUICKBOOKS_REDIRECT_URI: process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback (default)'
      }
    };

    console.log('📊 Configuration Test Results:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error in QuickBooks test endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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