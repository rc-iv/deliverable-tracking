import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

interface CreateInvoiceRequest {
  dealId: number;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity?: number;
    unitPrice?: number;
  }>;
  dueDate?: string;
  memo?: string;
  salesTermRef?: string;
  invoiceNumber?: string; // Allow manual invoice number override
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceRequest = await request.json();
    
    // Validate required fields
    if (!body.dealId || !body.customerName || !body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: dealId, customerName, and lineItems are required' 
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
      console.log('🔍 Creating QuickBooks invoice for deal:', body.dealId);
      
      // Use provided customer ID or find/create customer
      let customerId: string;
      if (body.customerId) {
        console.log('✅ Using provided customer ID:', body.customerId);
        customerId = body.customerId;
      } else {
        customerId = await findOrCreateCustomer(accessToken, realmId, body.customerName, body.customerEmail);
      }
      
      // Get next invoice number if not provided
      let invoiceNumber = body.invoiceNumber;
      if (!invoiceNumber) {
        console.log('🔍 Getting next invoice number...');
        const nextNumberResponse = await fetch(buildQuickBooksApiUrl(
          `/query?query=select DocNumber from Invoice where DocNumber is not null order by cast(DocNumber as int) desc maxresults 1`, 
          realmId
        ), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (nextNumberResponse.ok) {
          const nextNumberData = await nextNumberResponse.json();
          const invoices = nextNumberData.QueryResponse?.Invoice || [];
          let nextNumber = 1;
          
          if (invoices.length > 0) {
            const latestInvoice = invoices[0];
            const currentNumber = latestInvoice.DocNumber;
            
            if (currentNumber) {
              // Try to parse the number and increment it
              const numericPart = currentNumber.replace(/\D/g, '');
              if (numericPart) {
                nextNumber = parseInt(numericPart, 10) + 1;
              }
            }
          }
          
          invoiceNumber = nextNumber.toString();
          console.log('✅ Next invoice number:', invoiceNumber);
        }
      }
      
      // Build invoice data
      const invoiceData = {
        CustomerRef: {
          value: customerId
        },
        DocNumber: invoiceNumber, // Include the invoice number
        Line: [
          ...body.lineItems.map((item, index) => ({
            Id: index + 1,
            LineNum: index + 1,
            Description: item.description,
            Amount: item.amount,
            DetailType: "SalesItemLineDetail" as const,
            SalesItemLineDetail: {
              ItemRef: {
                value: "1", // Default item - you might want to make this configurable
                name: "Services"
              },
              UnitPrice: item.unitPrice || item.amount,
              Qty: item.quantity || 1,
              TaxCodeRef: {
                value: "NON"
              }
            }
          })),
          {
            Amount: body.lineItems.reduce((sum, item) => sum + item.amount, 0),
            DetailType: "SubTotalLineDetail" as const,
            SubTotalLineDetail: {}
          }
        ],
        DueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        CustomerMemo: {
          value: body.memo || `Invoice for Deal #${body.dealId}`
        },
        SalesTermRef: body.salesTermRef ? {
          value: body.salesTermRef
        } : undefined
      };

      console.log('📦 Invoice data to create:', JSON.stringify(invoiceData, null, 2));
      
      const url = buildQuickBooksApiUrl('/invoice', realmId);
      
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ QuickBooks API error response:', errorText);
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Invoice created successfully:', JSON.stringify(data, null, 2));

      // Check if QuickBooks ignored our DocNumber and assigned a different one
      const createdInvoice = data.Invoice;
      const actualDocNumber = createdInvoice.DocNumber;
      
      if (actualDocNumber !== invoiceNumber) {
        console.log(`⚠️ QuickBooks assigned DocNumber ${actualDocNumber} instead of requested ${invoiceNumber}`);
        console.log('🔄 Attempting to update invoice with correct DocNumber...');
        
        // Try to update the invoice with the correct DocNumber
        const updateData = {
          ...createdInvoice,
          DocNumber: invoiceNumber,
          sparse: true // Only update the specified fields
        };
        
        const updateUrl = buildQuickBooksApiUrl('/invoice', realmId);
        const updateResponse = await fetch(updateUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ Successfully updated invoice DocNumber to:', invoiceNumber);
          return updateResult;
        } else {
          console.log('⚠️ Failed to update invoice DocNumber, using QuickBooks assigned number');
        }
      }

      return data;
    });

    // Format the response
    const response = {
      success: true,
      invoice: result.Invoice,
      invoiceId: result.Invoice.Id,
      invoiceNumber: result.Invoice.DocNumber,
      totalAmount: result.Invoice.TotalAmt,
      customerName: result.Invoice.CustomerRef.name,
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error creating QuickBooks invoice:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

async function findOrCreateCustomer(accessToken: string, realmId: string, customerName: string, customerEmail?: string): Promise<string> {
  console.log('🔍 Looking for existing customer:', customerName);
  
  // First, try to find existing customer using DisplayName
  const searchUrl = buildQuickBooksApiUrl(
    `/query?query=select * from Customer where DisplayName = '${encodeURIComponent(customerName)}'`, 
    realmId
  );
  
  const searchResponse = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    const existingCustomers = searchData.QueryResponse?.Customer || [];
    
    if (existingCustomers.length > 0) {
      console.log('✅ Found existing customer:', existingCustomers[0].Id);
      return existingCustomers[0].Id;
    }
  }

  // Create new customer if not found
  console.log('🆕 Creating new customer:', customerName);
  
  const customerData = {
    DisplayName: customerName,
    ...(customerEmail && {
      PrimaryEmailAddr: {
        Address: customerEmail
      }
    })
  };

  const createUrl = buildQuickBooksApiUrl('/customer', realmId);
  
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create customer: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
  }

  const customerResult = await createResponse.json();
  console.log('✅ Customer created successfully:', customerResult.Customer.Id);
  
  return customerResult.Customer.Id;
} 