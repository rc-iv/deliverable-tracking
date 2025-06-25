import { NextRequest, NextResponse } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;

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

    // For now, we'll search all tasks and filter by custom field
    // In the future, this will be optimized to search by custom field directly
    const allTasks = await asanaClient.searchTasks({
      opt_fields: 'name,notes,completed,completed_at,due_date,due_on,assignee,projects,custom_fields,created_at,modified_at',
      limit: 100 // Adjust as needed
    });

    // Filter tasks that have the deal ID in their custom fields
    // This assumes we'll create a custom field called "Pipedrive Deal ID"
    const dealTasks = allTasks.filter(task => {
      if (!task.custom_fields) return false;
      
      return task.custom_fields.some(field => {
        // Look for a custom field that contains the deal ID
        // This will need to be updated once we know the exact field name/GID
        if (field.type === 'text' && field.text_value) {
          return field.text_value.includes(dealId);
        }
        if (field.type === 'number' && field.number_value) {
          return field.number_value.toString() === dealId;
        }
        return false;
      });
    });

    return NextResponse.json({
      success: true,
      tasks: dealTasks,
      count: dealTasks.length,
      dealId: dealId,
      note: 'This endpoint currently searches all tasks. Once custom field is set up, it will be optimized.'
    });

  } catch (error) {
    console.error('Asana tasks by deal error:', error);
    
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
        error: 'Failed to fetch Asana tasks for deal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
