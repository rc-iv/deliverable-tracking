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

    // Create Asana client
    const asanaClient = new AsanaClient(accessToken);

    // Test the connection by getting current user
    const currentUser = await asanaClient.getCurrentUser();
    
    // Get user workspaces
    const workspaces = await asanaClient.getWorkspaces();

    return NextResponse.json({
      success: true,
      message: 'Asana connection successful',
      user: currentUser,
      workspaces: workspaces,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Asana test error:', error);
    
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
        error: 'Failed to test Asana connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 