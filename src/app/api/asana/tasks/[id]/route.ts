import { NextRequest, NextResponse } from 'next/server';
import { AsanaClient } from '@/lib/asana/client';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    console.log('🔍 Fetching Asana task details for ID:', taskId);

    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('asana_access_token')?.value;

    if (!accessToken) {
      console.log('❌ No Asana access token found');
      return NextResponse.json({ 
        success: false, 
        error: 'Asana access token not found. Please reconnect to Asana.' 
      }, { status: 401 });
    }

    // Create Asana client and fetch task
    const asanaClient = new AsanaClient(accessToken);
    const task = await asanaClient.getTask(taskId);

    console.log('✅ Task fetched successfully:', task.name);

    return NextResponse.json({
      success: true,
      task: task
    });

  } catch (error) {
    console.error('💥 Error fetching Asana task:', error);
    
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Asana authentication expired. Please reconnect to Asana.' 
      }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task not found or you may not have access to it.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch task details' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    
    console.log('🔄 Updating Asana task ID:', taskId, 'with data:', body);

    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('asana_access_token')?.value;

    if (!accessToken) {
      console.log('❌ No Asana access token found');
      return NextResponse.json({ 
        success: false, 
        error: 'Asana access token not found. Please reconnect to Asana.' 
      }, { status: 401 });
    }

    // Create Asana client and update task
    const asanaClient = new AsanaClient(accessToken);
    const updatedTask = await asanaClient.updateTask(taskId, body);

    console.log('✅ Task updated successfully:', updatedTask.name);

    return NextResponse.json({
      success: true,
      task: updatedTask
    });

  } catch (error) {
    console.error('💥 Error updating Asana task:', error);
    
    if (error instanceof Error && error.message.includes('401')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Asana authentication expired. Please reconnect to Asana.' 
      }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task not found or you may not have access to it.' 
      }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to edit this task.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    }, { status: 500 });
  }
} 