import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { QuickBooksInvoice } from '@/lib/quickbooks/types';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

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
        ? buildQuickBooksApiUrl(`/invoice/${id}`, realmId)
        : buildQuickBooksApiUrl(`/query?query=SELECT * FROM Invoice`, realmId);
      
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

export async function PUT(request: NextRequest) {
  try {
    // Get the latest QuickBooksToken
    const tokenRecord = await prisma.quickBooksToken.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: 'No QuickBooks token found in database.' }, { status: 400 });
    }
    const { realmId } = tokenRecord;

    // Parse the request body
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    if (!updates || (typeof updates !== 'object')) {
      return NextResponse.json({ success: false, error: 'Updates object is required' }, { status: 400 });
    }

    // Validate allowed fields
    const allowedFields = ['TxnDate', 'Line'];
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid fields: ${invalidFields.join(', ')}. Only TxnDate and Line are allowed.` 
      }, { status: 400 });
    }

    // Use the utility to handle token refresh and API call
    const result = await withQuickBooksAuth(realmId, async (accessToken) => {
      console.log('🔍 Updating QuickBooks invoice...');
      console.log('📋 Invoice ID:', id);
      console.log('📝 Updates:', JSON.stringify(updates, null, 2));

      // First, get the current invoice to get the SyncToken
      const getUrl = buildQuickBooksApiUrl(`/invoice/${id}`, realmId);
      console.log('📡 Get URL:', getUrl);
      
      const getResponse = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch invoice: ${getResponse.status} ${getResponse.statusText}`);
      }

      const currentInvoice = await getResponse.json();
      console.log('📦 Current invoice:', JSON.stringify(currentInvoice, null, 2));

      if (!currentInvoice.Invoice) {
        throw new Error('Invoice not found');
      }

      // Prepare the update payload
      const updatePayload: Partial<QuickBooksInvoice> = {
        Id: id,
        SyncToken: currentInvoice.Invoice.SyncToken,
        sparse: false,
        // Include required fields from the original invoice
        CustomerRef: currentInvoice.Invoice.CustomerRef,
        Line: currentInvoice.Invoice.Line
      };

      console.log('🔍 Current SyncToken:', currentInvoice.Invoice.SyncToken);
      console.log('📝 Updates requested:', updates);

      // Add the updates
      if (updates.TxnDate) {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(updates.TxnDate)) {
          throw new Error('Invalid date format. Expected YYYY-MM-DD format.');
        }
        updatePayload.TxnDate = updates.TxnDate;
        console.log('📅 Date update:', updates.TxnDate);
      }

      if (updates.Line) {
        // Validate line items structure
        if (!Array.isArray(updates.Line)) {
          throw new Error('Line items must be an array');
        }

        // Validate each line item
        updates.Line.forEach((line: any, index: number) => {
          if (!line.DetailType) {
            throw new Error(`Line item ${index + 1} missing DetailType`);
          }
          if (line.DetailType === 'SalesItemLineDetail' && !line.SalesItemLineDetail?.ItemRef?.value) {
            throw new Error(`Line item ${index + 1} missing ItemRef.value`);
          }
        });

        updatePayload.Line = updates.Line;
        console.log('📋 Line items update:', updates.Line.length, 'items');
      }

      console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));

      // Make the update request
      const updateUrl = buildQuickBooksApiUrl(`/invoice`, realmId);
      console.log('📡 Update URL:', updateUrl);
      console.log('🔑 Headers:', {
        'Authorization': 'Bearer ***',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
      
      const updateResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('❌ QuickBooks update error:', JSON.stringify(errorData, null, 2));
        
        // Extract the actual error message from QuickBooks
        let errorMessage = `QuickBooks update failed: ${updateResponse.status} ${updateResponse.statusText}`;
        
        if (errorData.Fault?.Error) {
          const errors = Array.isArray(errorData.Fault.Error) ? errorData.Fault.Error : [errorData.Fault.Error];
          const errorDetails = errors.map((err: any) => {
            return `${err.Detail || err.Message || 'Unknown error'} (Code: ${err.code || 'N/A'})`;
          }).join('; ');
          
          errorMessage = `QuickBooks validation error: ${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }

      const updateResult = await updateResponse.json();
      console.log('✅ Invoice updated successfully');
      console.log('📦 Update result:', JSON.stringify(updateResult, null, 2));

      return updateResult;
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: result.Invoice,
      raw: result
    });

  } catch (error) {
    console.error('❌ Error updating QuickBooks invoice:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 