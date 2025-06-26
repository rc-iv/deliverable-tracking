import { NextRequest, NextResponse } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    // Get access token from cookies
    const accessToken = request.cookies.get('asana_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'No Asana access token found. Please authenticate first.',
          authUrl: '/api/asana/auth'
        },
        { status: 401 }
      );
    }

    // Create Asana client
    const asanaClient = new AsanaClient(accessToken);

    // Get users in the workspace
    const users = await asanaClient.getWorkspaceUsers(workspaceId);

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length,
      workspaceId: workspaceId
    });

  } catch (error) {
    console.error('Asana workspace users error:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json(
        { 
          error: 'Asana authentication failed. Please re-authenticate.',
          authUrl: '/api/asana/auth'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch Asana workspace users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 