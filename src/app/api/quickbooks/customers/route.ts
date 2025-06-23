import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
}

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
      console.log('🔍 Fetching QuickBooks customers...');
      const url = id 
        ? buildQuickBooksApiUrl(`/query?query=select * from Customer where Id = '${id}'`, realmId)
        : buildQuickBooksApiUrl(`/query?query=select * from Customer`, realmId);
      
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

      return data;
    });

    // Format the response
    const response = {
      success: true,
      customers: id ? result.QueryResponse?.Customer || [] : result.QueryResponse?.Customer || [],
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching QuickBooks customers:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerRequest = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'Customer name is required' 
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
      console.log('🆕 Creating QuickBooks customer:', body.name);
      
      // Build customer data
      const customerData: any = {
        DisplayName: body.name.trim(),
        Active: true
      };

      // Add optional fields
      if (body.email) {
        customerData.PrimaryEmailAddr = {
          Address: body.email.trim()
        };
      }

      if (body.phone) {
        customerData.PrimaryPhone = {
          FreeFormNumber: body.phone.trim()
        };
      }

      if (body.companyName) {
        customerData.CompanyName = body.companyName.trim();
      }

      const createUrl = buildQuickBooksApiUrl('/customer', realmId);
      
      console.log('📡 Create URL:', createUrl);
      console.log('📦 Customer data:', JSON.stringify(customerData, null, 2));
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ QuickBooks API error response:', errorText);
        throw new Error(`QuickBooks API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Customer created successfully:', JSON.stringify(data, null, 2));

      return data;
    });

    // Format the response
    const response = {
      success: true,
      customer: result.Customer,
      customerId: result.Customer.Id,
      customerName: result.Customer.Name,
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error creating QuickBooks customer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 