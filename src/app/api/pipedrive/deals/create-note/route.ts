import { NextRequest, NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, content } = body;

    if (!dealId || !content) {
      return NextResponse.json(
        { error: 'Deal ID and content are required' },
        { status: 400 }
      );
    }

    const pipedriveClient = new PipedriveClient();
    const response = await pipedriveClient.createNote(parseInt(dealId), content);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating note in Pipedrive:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create note in Pipedrive' },
      { status: 500 }
    );
  }
} 