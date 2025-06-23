import { NextRequest, NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY } from '@/lib/pipedrive/invoiceLinking';

interface UpdateInvoiceNumberRequest {
  dealId: number;
  invoiceNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateInvoiceNumberRequest = await request.json();
    
    // Validate required fields
    if (!body.dealId || !body.invoiceNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: dealId and invoiceNumber are required' 
      }, { status: 400 });
    }

    console.log('🔄 Updating Pipedrive deal with invoice number:', {
      dealId: body.dealId,
      invoiceNumber: body.invoiceNumber
    });

    const client = new PipedriveClient();
    
    // Update the deal with the invoice number
    const updateData = {
      [QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY]: body.invoiceNumber
    };

    console.log('📦 Update data:', updateData);
    
    const response = await client.updateDeal(body.dealId, updateData);
    
    if (!response.success) {
      console.error('❌ Failed to update Pipedrive deal:', response);
      return NextResponse.json({
        success: false,
        error: 'Failed to update Pipedrive deal with invoice number',
        details: response
      }, { status: 500 });
    }

    console.log('✅ Successfully updated Pipedrive deal with invoice number');
    
    return NextResponse.json({
      success: true,
      dealId: body.dealId,
      invoiceNumber: body.invoiceNumber,
      message: 'Deal updated successfully with invoice number',
      updatedDeal: response.data
    });
    
  } catch (error) {
    console.error('❌ Error updating Pipedrive deal with invoice number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 