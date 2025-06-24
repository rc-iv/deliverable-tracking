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

export async function PUT(
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

    const body = await request.json();
    const pipedriveClient = new PipedriveClient();
    
    // Test update: Add a small note to the title to test the update
    const currentTitle = body.title || 'Test Update';
    const updatedTitle = `${currentTitle} [Updated ${new Date().toLocaleTimeString()}]`;
    
    const response = await pipedriveClient.updateDeal(dealId, {
      title: updatedTitle
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update deal' },
      { status: 500 }
    );
  }
} 