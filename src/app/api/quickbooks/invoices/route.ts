import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';

export async function GET(request: NextRequest) {
  try {
    // Get the latest QuickBooksToken (for now, just use the first one)
    const tokenRecord = await prisma.quickBooksToken.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: 'No QuickBooks token found in database.' }, { status: 400 });
    }
    const { realmId } = tokenRecord;

    // Get the ID from the query parameters if it exists
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Use the utility to handle token refresh and API call
    const result = await withQuickBooksAuth(realmId, async (accessToken) => {
      console.log('🔍 Fetching QuickBooks invoices...');
      const url = id 
        ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/invoice/${id}`
        : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Invoice`;
      
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
      console.log('📦 Raw QuickBooks API Response:', JSON.stringify(data, null, 2));

      // Log specific fields we're having issues with
      if (data.Invoice) {
        console.log('🔍 Invoice Details:');
        console.log('Payment Status:', data.Invoice.PaymentStatus);
        console.log('Payment Method:', data.Invoice.PaymentMethodRef);
        console.log('Tax Details:', data.Invoice.TxnTaxDetail);
        console.log('Global Tax Calculation:', data.Invoice.GlobalTaxCalculation);
        console.log('Deposit:', data.Invoice.Deposit);
      }

      return data;
    });

    // Format the response
    const response = {
      success: true,
      invoices: id ? [result.Invoice] : result.QueryResponse?.Invoice || [],
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching QuickBooks invoices:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 