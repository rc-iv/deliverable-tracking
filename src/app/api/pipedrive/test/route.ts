import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function GET() {
  console.log('🚀 API endpoint /api/pipedrive/test called');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Testing connection...');
    const response = await client.testConnection();
    
    console.log('✅ Test endpoint successful');
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Test endpoint failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to Pipedrive API'
    }, { status: 500 });
  }
} 