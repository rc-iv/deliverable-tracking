import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

export async function GET(request: NextRequest) {
  try {
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
      console.log('🔍 Getting next available invoice number...');
      
      // Query for the most recent invoice by creation date
      const searchUrl = buildQuickBooksApiUrl(
        `/query?query=select DocNumber, MetaData.CreateTime from Invoice order by MetaData.CreateTime desc maxresults 1`, 
        realmId
      );
      
      console.log('📡 Search URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ QuickBooks API error response:', errorText);
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Invoice search successful:', JSON.stringify(data, null, 2));

      return data;
    });

    // Find the most recent invoice and get its number
    const invoices = result.QueryResponse?.Invoice || [];
    let nextNumber = 1;
    let currentHighestNumber = null;
    
    if (invoices.length > 0) {
      const latestInvoice = invoices[0];
      currentHighestNumber = latestInvoice.DocNumber;
      
      console.log('📊 Most recent invoice found:', {
        docNumber: latestInvoice.DocNumber,
        createTime: latestInvoice.MetaData?.CreateTime
      });
      
      if (currentHighestNumber) {
        // Try to parse the number as integer and increment
        const numericValue = parseInt(currentHighestNumber, 10);
        if (!isNaN(numericValue)) {
          nextNumber = numericValue + 1;
          console.log(`✅ Incremented invoice number: ${currentHighestNumber} → ${nextNumber}`);
        } else {
          console.log(`⚠️ Could not parse invoice number as integer: ${currentHighestNumber}, starting with 1`);
          nextNumber = 1;
        }
      }
    } else {
      console.log('📝 No invoices found, starting with number 1');
    }

    const nextInvoiceNumber = nextNumber.toString();

    const response = {
      success: true,
      nextInvoiceNumber,
      currentHighestNumber,
      totalInvoicesFound: invoices.length,
      raw: result // Include raw response for debugging
    };

    console.log('🎯 Next invoice number generated:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error getting next invoice number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 