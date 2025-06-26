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

interface EditedTaskState {
  name?: string;
  notes?: string;
  due_on?: string;
  completed?: boolean;
  assignee?: string;
  custom_fields?: Record<string, any>;
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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTask, setEditedTask] = useState<EditedTaskState>({});
  const [workspaceUsers, setWorkspaceUsers] = useState<AsanaUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      // For date-only fields from Asana, treat as local date to avoid timezone shifts
      // Asana due_on fields are in YYYY-MM-DD format and should be interpreted as local dates
      if (dateString.includes('T')) {
        // This is a full datetime, use normal parsing
        return new Date(dateString).toLocaleDateString();
      } else {
        // This is a date-only field (YYYY-MM-DD), parse as local date
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString();
      }
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

  const fetchWorkspaceUsers = async () => {
    try {
      setLoadingUsers(true);
      // Using hardcoded workspace ID from the main Asana page
      const workspaceId = '1201557518707781';
      
      const response = await fetch(`/api/asana/workspaces/${workspaceId}/users`);
      const data = await response.json();
      
      if (data.success) {
        setWorkspaceUsers(data.users);
      } else {
        console.error('Failed to fetch workspace users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching workspace users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEdit = () => {
    if (!task) return;
    
    // Fetch workspace users if not already loaded
    if (workspaceUsers.length === 0) {
      fetchWorkspaceUsers();
    }
    
    // Create a custom fields object for editing
    const customFieldsForEdit: Record<string, any> = {};
    if (task.custom_fields) {
      task.custom_fields.forEach(field => {
        customFieldsForEdit[field.gid] = field.text_value || field.number_value || field.enum_value?.gid || '';
      });
    }
    
    setEditedTask({
      name: task.name,
      notes: task.notes || '',
      due_on: task.due_on || '',
      completed: task.completed,
      assignee: task.assignee?.gid || '',
      custom_fields: customFieldsForEdit
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTask({});
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare the update data with proper field type validation
      const updateData: any = {
        name: editedTask.name,
        notes: editedTask.notes,
        due_on: editedTask.due_on,
        completed: editedTask.completed,
        assignee: editedTask.assignee || null
      };

      // Process custom fields with proper type conversion
      if (editedTask.custom_fields && task?.custom_fields) {
        const processedCustomFields: Record<string, any> = {};
        
        for (const [fieldGid, value] of Object.entries(editedTask.custom_fields)) {
          // Find the field definition to understand its type
          const fieldDef = task.custom_fields.find(f => f.gid === fieldGid);
          
          if (fieldDef) {
            if (fieldDef.type === 'number') {
              // For number fields, convert empty strings to null and ensure valid numbers
              if (value === '' || value === null || value === undefined) {
                processedCustomFields[fieldGid] = null;
              } else {
                const numValue = parseFloat(value as string);
                processedCustomFields[fieldGid] = isNaN(numValue) ? null : numValue;
              }
            } else if (fieldDef.type === 'enum') {
              // For enum fields, use the gid value or null
              processedCustomFields[fieldGid] = value || null;
            } else {
              // For text fields, use the string value or empty string
              processedCustomFields[fieldGid] = value || '';
            }
          }
        }
        
        updateData.custom_fields = processedCustomFields;
      }
      
      console.log('💾 Saving task updates:', updateData);
      
      const response = await fetch(`/api/asana/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save task updates');
      }
      
      console.log('✅ Task saved successfully');
      
      // Update the task state with the new data
      setTask(data.task);
      setIsEditing(false);
      setEditedTask({});
      
    } catch (err) {
      console.error('💥 Error saving task:', err);
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Fix timezone issue for overdue calculation
  const isOverdue = task.due_on && !task.completed && (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      let dueDate;
      if (task.due_on.includes('T')) {
        // Full datetime
        dueDate = new Date(task.due_on);
      } else {
        // Date-only field (YYYY-MM-DD), parse as local date
        const [year, month, day] = task.due_on.split('-').map(Number);
        dueDate = new Date(year, month - 1, day);
      }
      dueDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      return dueDate < today;
    } catch {
      return false;
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
        </div>

        {/* Task Title */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                  <input
                    type="text"
                    value={editedTask.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full text-2xl font-bold border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter task name"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{task.name}</h1>
                  {/* Status Badge */}
                  {isOverdue ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                      Overdue
                    </span>
                  ) : task.completed ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      In Progress
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Edit Controls */}
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Task
                </button>
              )}
            </div>
          </div>
          
          {/* Due Date */}
          {(isEditing || task.due_on) && (
            <div className="mb-4">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editedTask.due_on || ''}
                      onChange={(e) => handleFieldChange('due_on', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : task.due_on ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    Due: {formatDateOnly(task.due_on)}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {isEditing ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to</label>
                {loadingUsers ? (
                  <div className="text-gray-500">Loading users...</div>
                ) : (
                  <select
                    value={editedTask.assignee || ''}
                    onChange={(e) => handleFieldChange('assignee', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {workspaceUsers.map((user) => (
                      <option key={user.gid} value={user.gid}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : task.assignee ? (
              <div>
                <span className="font-medium text-gray-700">Assigned to: </span>
                <span className="text-gray-900">{task.assignee.name}</span>
                <span className="text-gray-500 text-sm ml-2">({task.assignee.email})</span>
              </div>
            ) : (
              <span className="text-gray-500">Unassigned</span>
            )}
          </div>

          {/* Task Completion Toggle */}
          {isEditing && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="completed"
                checked={editedTask.completed || false}
                onChange={(e) => handleFieldChange('completed', e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="completed" className="font-medium text-gray-700">
                Mark task as completed
              </label>
            </div>
          )}
        </Card>

        {/* Task Notes */}
        {(task.notes || isEditing) && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Notes
            </h2>
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Notes</label>
                <textarea
                  value={editedTask.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                  placeholder="Enter task notes or description..."
                />
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {task.notes}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Custom Fields - Full Width with 2 Columns */}
        {task.custom_fields && task.custom_fields.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Custom Fields
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {task.custom_fields.map((field, index) => {
                const isDeliverableField = field.name && (
                  field.name.toLowerCase().includes('deliverable') ||
                  field.name.toLowerCase().includes('link') ||
                  field.name.toLowerCase().includes('status')
                ) && !field.name.toLowerCase().includes('revenue');
                
                const currentValue = isEditing && editedTask.custom_fields 
                  ? editedTask.custom_fields[field.gid] 
                  : (field.text_value || field.number_value || field.enum_value?.name || '');
                
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="font-medium text-gray-700">{field.name || 'Unnamed Field'}</span>
                        </div>
                        
                        {isEditing && isDeliverableField ? (
                          <div>
                            {field.type === 'text' || field.type === 'single_line_text' ? (
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => {
                                  const newCustomFields = { ...editedTask.custom_fields };
                                  newCustomFields[field.gid] = e.target.value;
                                  handleFieldChange('custom_fields', newCustomFields);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                              />
                            ) : field.type === 'enum' ? (
                              <select
                                value={currentValue}
                                onChange={(e) => {
                                  const newCustomFields = { ...editedTask.custom_fields };
                                  newCustomFields[field.gid] = e.target.value;
                                  handleFieldChange('custom_fields', newCustomFields);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Select {field.name}</option>
                                {field.enum_options?.map((option: any) => (
                                  <option key={option.gid} value={option.gid}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                value={currentValue}
                                onChange={(e) => {
                                  const newCustomFields = { ...editedTask.custom_fields };
                                  newCustomFields[field.gid] = e.target.value;
                                  handleFieldChange('custom_fields', newCustomFields);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                              />
                            ) : (
                              <textarea
                                value={currentValue}
                                onChange={(e) => {
                                  const newCustomFields = { ...editedTask.custom_fields };
                                  newCustomFields[field.gid] = e.target.value;
                                  handleFieldChange('custom_fields', newCustomFields);
                                }}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-900 break-words">
                            {field.text_value || field.number_value || field.enum_value?.name || 'No value'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Placeholder section for future content */}
        <div className="text-gray-500 text-center py-8">
          <p>Additional task information can be added here</p>
        </div>

        {/* COMMENTED OUT - Projects Section (saved for debugging) */}
        {/* 
        {task.projects && task.projects.length > 0 && (
          <Card>
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
        */}

        {/* COMMENTED OUT - Task Metadata Section (saved for debugging) */}
        {/*
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Task Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
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
        */}
      </div>
    </div>
  );
} 