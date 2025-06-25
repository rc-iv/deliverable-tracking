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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project');
    const assignee = searchParams.get('assignee');
    const workspace = searchParams.get('workspace');
    const completedSince = searchParams.get('completed_since');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset');

    // Create Asana client
    const asanaClient = new AsanaClient(accessToken);

    // Build search parameters
    const searchParams_obj: any = {
      opt_fields: 'name,notes,completed,completed_at,due_date,due_on,assignee,projects,custom_fields,created_at,modified_at'
    };

    if (project) searchParams_obj.project = project;
    if (assignee) searchParams_obj.assignee = assignee;
    if (workspace) searchParams_obj.workspace = workspace;
    if (completedSince) searchParams_obj.completed_since = completedSince;
    if (limit) searchParams_obj.limit = limit;
    if (offset) searchParams_obj.offset = offset;

    // Search for tasks
    const tasks = await asanaClient.searchTasks(searchParams_obj);

    return NextResponse.json({
      success: true,
      tasks: tasks,
      count: tasks.length,
      filters: {
        project,
        assignee,
        workspace,
        completedSince,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Asana tasks error:', error);
    
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
        error: 'Failed to fetch Asana tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
