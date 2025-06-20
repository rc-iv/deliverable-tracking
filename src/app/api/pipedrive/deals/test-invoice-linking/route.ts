import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { 
  extractInvoiceNumberFromDeal, 
  hasInvoiceNumber, 
  getInvoiceLinkingInfo,
  getDealInvoiceLinking 
} from '@/lib/pipedrive/invoiceLinking';

export async function GET() {
  console.log('🧪 API endpoint /api/pipedrive/deals/test-invoice-linking called');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deals to test invoice linking...');
    const response = await client.getDeals(10, 0, 'open');
    
    if (!response.success || response.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deals found to test with',
        data: null
      });
    }
    
    console.log('🎯 Testing invoice linking with real deals...');
    
    const deals = response.data;
    const testResults = [];
    
    for (const deal of deals) {
      const invoiceNumber = extractInvoiceNumberFromDeal(deal);
      const hasInvoice = hasInvoiceNumber(deal);
      const linkingInfo = getInvoiceLinkingInfo(deal);
      
      let linkedInvoiceData = null;
      let error = null;
      
      if (hasInvoice && invoiceNumber) {
        try {
          const linkingResult = await getDealInvoiceLinking(deal);
          linkedInvoiceData = {
            found: linkingResult.linkedInvoice !== null,
            invoice: linkingResult.linkedInvoice ? {
              id: linkingResult.linkedInvoice.Id,
              docNumber: linkingResult.linkedInvoice.DocNumber,
              totalAmt: linkingResult.linkedInvoice.TotalAmt,
              balance: linkingResult.linkedInvoice.Balance,
              customerName: linkingResult.linkedInvoice.CustomerRef?.name
            } : null,
            error: linkingResult.error
          };
        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error';
        }
      }
      
      testResults.push({
        dealId: deal.id,
        dealTitle: deal.title,
        invoiceNumber,
        hasInvoiceNumber: hasInvoice,
        linkingInfo,
        linkedInvoiceData,
        error
      });
    }
    
    const summary = {
      totalDeals: deals.length,
      dealsWithInvoiceNumbers: testResults.filter(r => r.hasInvoiceNumber).length,
      dealsWithoutInvoiceNumbers: testResults.filter(r => !r.hasInvoiceNumber).length,
      successfulLinks: testResults.filter(r => r.linkedInvoiceData?.found).length,
      failedLinks: testResults.filter(r => r.linkedInvoiceData && !r.linkedInvoiceData.found).length,
      errors: testResults.filter(r => r.error || r.linkedInvoiceData?.error).length
    };
    
    console.log('📊 Invoice linking test results:', summary);
    
    return NextResponse.json({
      success: true,
      summary,
      testResults,
      message: `Tested ${deals.length} deals for invoice linking`
    });
    
  } catch (error) {
    console.error('❌ Error testing invoice linking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 