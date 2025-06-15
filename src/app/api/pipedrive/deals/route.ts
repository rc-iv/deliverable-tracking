import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function GET(request: Request) {
  console.log('🚀 API endpoint /api/pipedrive/deals called');
  
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const start = parseInt(searchParams.get('start') || '0');
  const status = (searchParams.get('status') || 'open') as 'open' | 'won' | 'lost' | 'all_not_deleted';
  
  console.log('📊 Request parameters:', { limit, start, status });
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deals...');
    const response = await client.getDeals(limit, start, status);
    
    console.log('✅ Deals endpoint successful');
    console.log('📈 Response summary:', {
      success: response.success,
      deals_count: response.data.length,
      status_filter: status,
      has_pagination: !!response.additional_data?.pagination
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${response.data.length} ${status} deals (archived deals excluded)`,
      data: response.data,
      pagination: response.additional_data?.pagination,
      filter: { status }
    });
  } catch (error) {
    console.error('💥 Deals endpoint failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch deals from Pipedrive API',
      data: [],
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }, { status: 500 });
  }
} 