import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { getFormattedCustomFields } from '@/lib/pipedrive/fieldMapping';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const dealId = (await params).id;
  
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

export async function PUT(request: Request, { params }: RouteParams) {
  const dealId = (await params).id;
  
  console.log('🔄 API endpoint /api/pipedrive/deals/[id] PUT called');
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
    // Parse request body
    const updates = await request.json();
    
    if (!updates || typeof updates !== 'object') {
      console.error('❌ Invalid request body - must be a JSON object');
      return NextResponse.json({
        success: false,
        message: 'Invalid request body. Must be a JSON object with field updates.',
        data: null
      }, { status: 400 });
    }
    
    console.log('📝 Received updates for', Object.keys(updates).length, 'fields');
    
    // Remove any potentially dangerous fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id; // Never allow ID changes
    delete safeUpdates.add_time; // Don't allow creation time changes
    
    if (Object.keys(safeUpdates).length === 0) {
      console.error('❌ No valid fields to update');
      return NextResponse.json({
        success: false,
        message: 'No valid fields provided for update.',
        data: null
      }, { status: 400 });
    }
    
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔄 Updating deal...');
    const response = await client.updateDeal(numericId, safeUpdates);
    
    if (!response.success || !response.data) {
      console.error('❌ Failed to update deal in Pipedrive');
      return NextResponse.json({
        success: false,
        message: `Failed to update deal with ID ${dealId}`,
        data: null
      }, { status: 500 });
    }
    
    const deal = response.data;
    
    // Format custom fields for the UI
    const formattedCustomFields = getFormattedCustomFields(deal);
    
    console.log('✅ Deal update endpoint successful');
    console.log('📈 Response summary:', {
      success: true,
      deal_id: deal.id,
      deal_title: deal.title,
      deal_value: deal.value,
      deal_status: deal.status,
      custom_fields_count: formattedCustomFields.length,
      fields_updated: Object.keys(safeUpdates).length
    });
    
    const result = {
      success: true,
      message: `Successfully updated deal "${deal.title}" (ID: ${deal.id})`,
      data: {
        ...deal,
        formatted_custom_fields: formattedCustomFields
      },
      metadata: {
        updated_at: new Date().toISOString(),
        fields_updated: Object.keys(safeUpdates),
        custom_fields_count: formattedCustomFields.length,
        total_fields_count: Object.keys(deal).length
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Deal update endpoint failed');
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
      
      if (error.message.includes('Invalid update data')) {
        return NextResponse.json({
          success: false,
          message: error.message,
          data: null
        }, { status: 400 });
      }
      
      if (error.message.includes('Permission denied')) {
        return NextResponse.json({
          success: false,
          message: error.message,
          data: null
        }, { status: 403 });
      }
    }
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update deal in Pipedrive API',
      data: null,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }, { status: 500 });
  }
} 