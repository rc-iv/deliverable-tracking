import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { getFormattedCustomFields } from '@/lib/pipedrive/fieldMapping';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const dealId = params.id;
  
  console.log('🚀 API endpoint /api/pipedrive/deals/[id] called');
  console.log('📊 Deal ID:', dealId);
  
  // Validate deal ID
  const numericId = parseInt(dealId);
  if (isNaN(numericId) || numericId <= 0) {
    console.error('❌ Invalid deal ID provided:', dealId);
    return NextResponse.json({
      success: false,
      message: `Invalid deal ID: ${dealId}. Deal ID must be a positive number.`,
      data: null
    }, { status: 400 });
  }
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deal...');
    const response = await client.getDeal(numericId);
    
    if (!response.success || !response.data) {
      console.error('❌ Failed to fetch deal from Pipedrive');
      return NextResponse.json({
        success: false,
        message: `Deal with ID ${dealId} not found`,
        data: null
      }, { status: 404 });
    }
    
    const deal = response.data;
    
    // Format custom fields for the UI
    const formattedCustomFields = getFormattedCustomFields(deal);
    
    console.log('✅ Deal endpoint successful');
    console.log('📈 Response summary:', {
      success: true,
      deal_id: deal.id,
      deal_title: deal.title,
      deal_value: deal.value,
      deal_status: deal.status,
      custom_fields_count: formattedCustomFields.length,
      has_pagination: !!response.additional_data?.pagination
    });
    
    const result = {
      success: true,
      message: `Successfully fetched deal "${deal.title}" (ID: ${deal.id})`,
      data: {
        ...deal,
        formatted_custom_fields: formattedCustomFields
      },
      metadata: {
        fetched_at: new Date().toISOString(),
        custom_fields_count: formattedCustomFields.length,
        total_fields_count: Object.keys(deal).length
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Deal endpoint failed');
    console.error('💥 Error details:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          message: error.message,
          data: null
        }, { status: 404 });
      }
      
      if (error.message.includes('deleted or archived')) {
        return NextResponse.json({
          success: false,
          message: error.message,
          data: null
        }, { status: 410 }); // 410 Gone - resource was deleted
      }
    }
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch deal from Pipedrive API',
      data: null,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }, { status: 500 });
  }
} 