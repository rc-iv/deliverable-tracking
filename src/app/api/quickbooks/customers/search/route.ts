import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withQuickBooksAuth } from '@/lib/quickbooks/oauth';
import { buildQuickBooksApiUrl } from '@/lib/quickbooks/config';

interface SearchCustomersRequest {
  query?: string;
  page?: number;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchCustomersRequest = await request.json();
    const { query = '', page = 1, limit = 50 } = body;

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
      console.log('🔍 Searching QuickBooks customers with query:', query);
      
      // Build the query string
      let queryString = 'select * from Customer';
      
      if (query.trim()) {
        queryString += ' where DisplayName like \'%' + query.replace(/'/g, '\\\'') + '%\'';
      }
      
      // Add pagination
      const startPosition = (page - 1) * limit + 1;
      queryString += ` startposition ${startPosition} maxresults ${limit}`;
      
      const searchUrl = buildQuickBooksApiUrl(`/query?query=${encodeURIComponent(queryString)}`, realmId);
      
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
      console.log('✅ Customer search successful:', {
        total: data.QueryResponse?.Customer?.length || 0,
        page,
        limit,
        totalCount: data.QueryResponse?.totalCount || 0
      });

      return data;
    });

    // Format the response
    const customers = result.QueryResponse?.Customer || [];
    const totalCount = result.QueryResponse?.totalCount || customers.length;
    
    const response = {
      success: true,
      customers: customers.map((customer: any) => ({
        id: customer.Id,
        name: customer.DisplayName || customer.Name,
        email: customer.PrimaryEmailAddr?.Address,
        phone: customer.PrimaryPhone?.FreeFormNumber,
        companyName: customer.CompanyName,
        displayName: customer.DisplayName,
        active: customer.Active,
        balance: customer.Balance,
        totalRevenue: customer.TotalRevenue,
        created: customer.MetaData?.CreateTime,
        updated: customer.MetaData?.LastUpdatedTime
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      },
      raw: result // Include raw response for debugging
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error searching QuickBooks customers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 