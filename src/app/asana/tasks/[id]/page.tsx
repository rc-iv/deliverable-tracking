'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AsanaUser {
  gid: string;
  name: string;
  email: string;
  photo?: {
    "image_21x21"?: string;
    "image_27x27"?: string;
    "image_36x36"?: string;
    "image_60x60"?: string;
    "image_128x128"?: string;
  };
}

interface AsanaProject {
  gid: string;
  name: string;
  resource_type: string;
  archived: boolean;
  completed: boolean;
}

interface AsanaTask {
  gid: string;
  name: string;
  resource_type: string;
  assignee?: AsanaUser;
  assignee_status?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  due_at?: string;
  due_on?: string;
  modified_at: string;
  notes?: string;
  projects: AsanaProject[];
  tags: any[];
  custom_fields?: any[];
}

interface TaskResponse {
  success: boolean;
  task?: AsanaTask;
  error?: string;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<AsanaTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching task details for ID:', taskId);
      
      const response = await fetch(`/api/asana/tasks/${taskId}`);
      const data: TaskResponse = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch task details');
      }
      
      if (!data.task) {
        throw new Error('No task data received');
      }
      
      setTask(data.task);
      console.log('✅ Task loaded successfully:', data.task.name);
      
    } catch (err) {
      console.error('💥 Error fetching task:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const handleGoBack = () => {
    router.push('/asana');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading task details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error loading task</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={fetchTask}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoBack}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-500">Task not found</p>
            <button
              onClick={handleGoBack}
              className="mt-4 text-purple-600 hover:text-purple-500 font-medium"
            >
              Go Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue = task.due_on && new Date(task.due_on) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tasks
            </button>
          </div>
          <div className="flex items-center gap-2">
            {task.completed ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                Completed
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                In Progress
              </span>
            )}
          </div>
        </div>

        {/* Task Title */}
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.name}</h1>
          
          {/* Due Date */}
          {task.due_on && (
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                Due: {formatDateOnly(task.due_on)}
                {isOverdue && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <span className="font-medium text-gray-700">Assigned to: </span>
                <span className="text-gray-900">{task.assignee.name}</span>
                <span className="text-gray-500 text-sm ml-2">({task.assignee.email})</span>
              </div>
            </div>
          )}
        </Card>

        {/* Task Notes */}
        {task.notes && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Notes
            </h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                {task.notes}
              </div>
            </div>
          </Card>
        )}

        {/* Projects */}
        {task.projects && task.projects.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Projects
            </h2>
            <div className="space-y-2">
              {task.projects.map((project) => (
                <div key={project.gid} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{project.name}</span>
                  {project.completed && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Completed
                    </span>
                  )}
                  {project.archived && (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      Archived
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Custom Fields */}
        {task.custom_fields && task.custom_fields.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Custom Fields
            </h2>
            <div className="space-y-3">
              {task.custom_fields.map((field, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">{field.name || 'Unnamed Field'}</span>
                    <div className="text-sm text-gray-500 mt-1">Type: {field.type || 'Unknown'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900">
                      {field.text_value || field.number_value || field.enum_value?.name || 'No value'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Task Metadata */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Task Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Task ID</div>
              <div className="font-mono text-sm text-gray-900 bg-gray-100 p-2 rounded">{task.gid}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="text-gray-900">{task.assignee_status || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="text-gray-900">{formatDate(task.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Last Modified</div>
              <div className="text-gray-900">{formatDate(task.modified_at)}</div>
            </div>
            {task.completed_at && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Completed</div>
                <div className="text-gray-900">{formatDate(task.completed_at)}</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 