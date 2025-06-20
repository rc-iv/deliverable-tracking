import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, newDate, newLineItems } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    // Prepare the update payload
    const updates: any = {};
    
    if (newDate) {
      updates.TxnDate = newDate;
    }
    
    if (newLineItems && Array.isArray(newLineItems)) {
      updates.Line = newLineItems;
    }

    // Make the update request to our API
    const response = await fetch(`${request.nextUrl.origin}/api/quickbooks/invoices`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: invoiceId,
        updates
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Test update completed successfully',
      result
    });

  } catch (error) {
    console.error('❌ Error in test update:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 