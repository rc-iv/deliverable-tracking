import { NextRequest, NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }

    const pipedriveClient = new PipedriveClient();
    const response = await pipedriveClient.getDeal(dealId);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deal' },
      { status: 500 }
    );
  }
} 