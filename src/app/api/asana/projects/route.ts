import { NextRequest, NextResponse } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';

export async function GET(request: NextRequest) {
  try {
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

    // Get workspace ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Create Asana client
    const asanaClient = new AsanaClient(accessToken);

    // Get projects in the workspace
    const projects = await asanaClient.getProjects(workspaceId);

    return NextResponse.json({
      success: true,
      projects: projects,
      count: projects.length,
      workspaceId: workspaceId
    });

  } catch (error) {
    console.error('Asana projects error:', error);
    
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
        error: 'Failed to fetch Asana projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
