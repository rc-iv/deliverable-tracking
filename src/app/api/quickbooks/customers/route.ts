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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    // Use the utility to handle token refresh and API call
    const result = await withQuickBooksAuth(realmId, async (accessToken, realmId) => {
      const url = id
        ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Customer where Id = '${id}'`
        : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Customer`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/text',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      return data.QueryResponse.Customer || [];
    });
    return NextResponse.json({ success: true, customers: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
} 