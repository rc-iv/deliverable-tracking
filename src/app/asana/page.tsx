'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AsanaUser {
  gid: string;
  name: string;
  email: string;
}

interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  assignee?: AsanaUser;
  due_on?: string;
  notes?: string;
  custom_fields?: any[];
  created_at: string;
  modified_at: string;
}

interface TasksResponse {
  success: boolean;
  project?: {
    gid: string;
    name: string;
  };
  tasks?: AsanaTask[];
  count?: number;
  totalTasksInProject?: number;
  error?: string;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {children}
    </div>
  );
}

function TaskCard({ task, onClick }: { task: AsanaTask; onClick: () => void }) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const isOverdue = task.due_on && new Date(task.due_on) < new Date();

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      <Card>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">
            {task.name}
          </h3>
          {task.due_on && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
              isOverdue 
                ? 'bg-red-100 text-red-800 border-red-200' 
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              Due {formatDate(task.due_on)}
            </span>
          )}
        </div>

        {task.assignee && (
          <div className="text-sm text-gray-500 mb-2">
            <span className="font-medium">Assignee:</span> {task.assignee.name}
          </div>
        )}

        {task.notes && (
          <div className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded">
            {task.notes.length > 150 ? `${task.notes.substring(0, 150)}...` : task.notes}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            Created: {formatDate(task.created_at)}
          </div>
          {task.custom_fields && task.custom_fields.length > 0 && (
            <div className="text-purple-600 font-medium">
              {task.custom_fields.length} custom field{task.custom_fields.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Click indicator */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Click to view details
          </span>
        </div>
      </Card>
    </div>
  );
}

const WORKSPACE_ID = '1201557518707781';
const PROJECT_ID = '1206197443983749';

export default function AsanaPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AsanaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [projectName, setProjectName] = useState('Sponsorship Fulfillment');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching open tasks from Sponsorship Fulfillment project');
      const response = await fetch(`/api/asana/projects/${PROJECT_ID}/tasks?include_completed=false`);
      const data: TasksResponse = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (data.success && data.tasks && data.project) {
        setTasks(data.tasks);
        setProjectName(data.project.name);
        setIsConnected(true);
        console.log('✅ Tasks loaded successfully:', data.tasks.length, 'open tasks');
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('💥 Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test connection with the test endpoint
      const response = await fetch('/api/asana/test');
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        // If connected, fetch tasks
        await fetchTasks();
      } else {
        setIsConnected(false);
        setError('Not connected to Asana');
      }
    } catch (err: any) {
      setIsConnected(false);
      setError('Not connected to Asana');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/asana/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Asana Tasks</h1>
        
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Loading tasks from {projectName}...</p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-gray-600 mb-6">
                <p className="text-lg mb-2">Not connected to Asana</p>
                <p className="text-sm">Connect your Asana account to view tasks from the {projectName} project.</p>
              </div>
              <button
                onClick={handleConnect}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Connect to Asana
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error loading tasks</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchTasks}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Project Info Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-purple-800 mb-2">{projectName}</h2>
              <p className="text-gray-600">
                {tasks.length} open {tasks.length === 1 ? 'task' : 'tasks'} • Updated {new Date().toLocaleString()}
              </p>
            </div>

            {/* Tasks Grid */}
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No open tasks found</h3>
                <p className="text-gray-500 mb-4">
                  All tasks in the {projectName} project are completed.
                </p>
                <button
                  onClick={fetchTasks}
                  className="text-purple-600 hover:text-purple-500 font-medium"
                >
                  Refresh tasks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <TaskCard 
                    key={task.gid} 
                    task={task} 
                    onClick={() => router.push(`/asana/tasks/${task.gid}`)}
                  />
                ))}
              </div>
            )}

            {/* Refresh Button */}
            <div className="mt-8 text-center">
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh Tasks'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 