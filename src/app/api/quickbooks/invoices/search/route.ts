import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

export async function GET(request: NextRequest) {
  try {
    // Get the invoice number from query parameters
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');
    
    if (!invoiceNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice number is required' 
      }, { status: 400 });
    }

    // Get the latest QuickBooksToken
    const tokenRecord = await prisma.quickBooksToken.findFirst({ 
      orderBy: { updatedAt: 'desc' } 
    });
    
    if (!tokenRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'No QuickBooks token found in database.' 
      }, { status: 400 });
    }
    
    const { realmId } = tokenRecord;

    // Use the utility to handle token refresh and API call
    const result = await withQuickBooksAuth(realmId, async (accessToken) => {
      console.log('🔍 Searching QuickBooks invoices by invoice number:', invoiceNumber);
      
      // Search for invoices by DocNumber (invoice number)
      const url = buildQuickBooksApiUrl(
        `/query?query=select * from Invoice where DocNumber = '${invoiceNumber}'`, 
        realmId
      );
      
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 QuickBooks search response:', JSON.stringify(data, null, 2));

      return data;
    });

    // Format the response
    const invoices = result.QueryResponse?.Invoice || [];
    const response = {
      success: true,
      invoiceNumber,
      invoices,
      count: invoices.length,
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error searching QuickBooks invoices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 