import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  const dealId = params.id;
  
  console.log('🧪 API endpoint /api/pipedrive/deals/[id]/test called - testing deal update');
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
    
    // First, fetch the current deal to see its state
    console.log('🔍 Fetching current deal state...');
    const currentDeal = await client.getDeal(numericId);
    
    if (!currentDeal.success || !currentDeal.data) {
      return NextResponse.json({
        success: false,
        message: `Deal with ID ${dealId} not found`,
        data: null
      }, { status: 404 });
    }
    
    console.log('📊 Current deal state:', {
      id: currentDeal.data.id,
      title: currentDeal.data.title,
      value: currentDeal.data.value,
      status: currentDeal.data.status
    });
    
    // Test update: Add a small note to the title to test the update
    const originalTitle = currentDeal.data.title;
    const testTitle = `${originalTitle} [TEST UPDATE]`;
    
    console.log('🔄 Testing deal update...');
    console.log('📝 Original title:', originalTitle);
    console.log('📝 Test title:', testTitle);
    
    const updateResponse = await client.updateDeal(numericId, {
      title: testTitle
    });
    
    if (!updateResponse.success || !updateResponse.data) {
      console.error('❌ Failed to update deal');
      return NextResponse.json({
        success: false,
        message: 'Failed to update deal',
        data: null
      }, { status: 500 });
    }
    
    console.log('✅ Deal updated successfully');
    
    // Revert the change immediately
    console.log('🔄 Reverting test change...');
    const revertResponse = await client.updateDeal(numericId, {
      title: originalTitle
    });
    
    if (!revertResponse.success) {
      console.warn('⚠️ Failed to revert test change - deal title may still have [TEST UPDATE]');
    } else {
      console.log('✅ Test change reverted successfully');
    }
    
    const result = {
      success: true,
      message: `Deal update test completed successfully for deal "${originalTitle}" (ID: ${numericId})`,
      data: {
        test_performed: 'Title update and revert',
        original_title: originalTitle,
        test_title: testTitle,
        update_successful: updateResponse.success,
        revert_successful: revertResponse.success,
        final_title: revertResponse.data?.title || 'Unknown'
      },
      metadata: {
        tested_at: new Date().toISOString(),
        deal_id: numericId
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Deal update test failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Deal update test failed',
      data: null,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }, { status: 500 });
  }
} 