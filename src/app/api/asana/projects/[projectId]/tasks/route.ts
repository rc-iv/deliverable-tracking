import { NextRequest, NextResponse } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    // Get project ID from route parameters
    const { projectId } = await context.params;

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const includeCompleted = searchParams.get('include_completed') === 'true';
    const assignee = searchParams.get('assignee');
    const modifiedSince = searchParams.get('modified_since');

    // Create Asana client
    const asanaClient = new AsanaClient(accessToken);

    // Get tasks from the project (don't specify workspace - Asana doesn't allow both)
    const allTasks = await asanaClient.getTasks(projectId, undefined, {
      assignee: assignee || undefined,
      modified_since: modifiedSince || undefined,
      limit: 100, // Limit to 100 tasks for now
    });

    // Filter tasks based on completion status if needed
    const filteredTasks = includeCompleted 
      ? allTasks 
      : allTasks.filter(task => !task.completed);

    // Get additional project details for context
    let projectName = 'Unknown Project';
    try {
      // Get all projects to find the name of our project
      const workspaces = await asanaClient.getWorkspaces();
      if (workspaces.length > 0) {
        const projects = await asanaClient.getProjects(workspaces[0].gid);
        const project = projects.find(p => p.gid === projectId);
        if (project) {
          projectName = project.name;
        }
      }
    } catch (error) {
      console.warn('Could not fetch project name:', error);
    }

    return NextResponse.json({
      success: true,
      project: {
        gid: projectId,
        name: projectName
      },
      tasks: filteredTasks,
      count: filteredTasks.length,
      totalTasksInProject: allTasks.length,
      filters: {
        includeCompleted,
        assignee: assignee || 'all',
        modifiedSince: modifiedSince || 'all time'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Asana project tasks error:', error);
    
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
        error: 'Failed to fetch tasks from Asana project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 