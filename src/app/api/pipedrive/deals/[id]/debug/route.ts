import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const dealId = params.id;
  
  console.log('🐛 Debug endpoint called - checking PipedriveClient methods');
  console.log('📊 Deal ID:', dealId);
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    // Debug: Check what methods are available on the client
    const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
    console.log('🔍 Available client methods:', clientMethods);
    
    // Check specifically for updateDeal
    const hasUpdateDeal = typeof client.updateDeal === 'function';
    console.log('🔍 updateDeal method exists:', hasUpdateDeal);
    console.log('🔍 updateDeal type:', typeof client.updateDeal);
    
    // Also check getDeal for comparison
    const hasGetDeal = typeof client.getDeal === 'function';
    console.log('🔍 getDeal method exists:', hasGetDeal);
    console.log('🔍 getDeal type:', typeof client.getDeal);
    
    return NextResponse.json({
      success: true,
      message: 'Debug information collected',
      data: {
        available_methods: clientMethods,
        has_update_deal: hasUpdateDeal,
        update_deal_type: typeof client.updateDeal,
        has_get_deal: hasGetDeal,
        get_deal_type: typeof client.getDeal,
        client_constructor_name: client.constructor.name
      }
    });
    
  } catch (error) {
    console.error('💥 Debug endpoint failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Debug failed',
      data: null,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    }, { status: 500 });
  }
} 