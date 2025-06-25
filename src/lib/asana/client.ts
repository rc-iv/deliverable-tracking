import { buildAsanaApiUrl } from "./config";

export interface AsanaUser {
  gid: string;
  email: string;
  name: string;
  photo?: {
    "image_21x21"?: string;
    "image_27x27"?: string;
    "image_36x36"?: string;
    "image_60x60"?: string;
    "image_128x128"?: string;
  };
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  resource_type: string;
  archived: boolean;
  completed: boolean;
  current_status?: {
    color: string;
    text: string;
  };
  due_date?: string;
  due_on?: string;
  public: boolean;
}

export interface AsanaTask {
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

export class AsanaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = buildAsanaApiUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asana API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async getCurrentUser(): Promise<AsanaUser> {
    return this.makeRequest<AsanaUser>('/users/me');
  }

  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    return this.makeRequest<AsanaWorkspace[]>('/workspaces');
  }

  async getProjects(workspaceGid: string): Promise<AsanaProject[]> {
    return this.makeRequest<AsanaProject[]>(`/projects?workspace=${workspaceGid}&opt_fields=name,archived,completed,current_status,due_date,due_on,public`);
  }

  async getTasks(projectGid?: string, workspaceGid?: string, options?: {
    assignee?: string;
    completed_since?: string;
    modified_since?: string;
    limit?: number;
  }): Promise<AsanaTask[]> {
    let endpoint = '/tasks?opt_fields=name,assignee,assignee_status,completed,completed_at,created_at,due_at,due_on,modified_at,notes,projects,tags,custom_fields';
    
    const params = new URLSearchParams();
    
    if (projectGid) {
      params.append('project', projectGid);
      // NOTE: Don't specify workspace when fetching project tasks - Asana doesn't allow both
    } else if (workspaceGid) {
      params.append('workspace', workspaceGid);
    }
    
    // Add limit parameter to control pagination
    const limit = options?.limit || 100; // Default to 100 tasks
    params.append('limit', limit.toString());
    
    if (options) {
      if (options.assignee) params.append('assignee', options.assignee);
      if (options.completed_since) params.append('completed_since', options.completed_since);
      if (options.modified_since) params.append('modified_since', options.modified_since);
    }
    
    if (params.toString()) {
      endpoint += `&${params.toString()}`;
    }

    return this.makeRequest<AsanaTask[]>(endpoint);
  }

  async getTasksByCustomField(workspaceGid: string, customFieldGid: string, customFieldValue: string): Promise<AsanaTask[]> {
    const tasks = await this.getTasks(undefined, workspaceGid);
    
    return tasks.filter(task => {
      if (!task.custom_fields) return false;
      
      return task.custom_fields.some(field => 
        field.gid === customFieldGid && 
        (field.text_value === customFieldValue || field.number_value?.toString() === customFieldValue)
      );
    });
  }

  async createTask(data: {
    name: string;
    notes?: string;
    assignee?: string;
    due_on?: string;
    projects?: string[];
    custom_fields?: Record<string, any>;
  }): Promise<AsanaTask> {
    return this.makeRequest<AsanaTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async updateTask(taskGid: string, data: {
    name?: string;
    notes?: string;
    assignee?: string;
    due_on?: string;
    completed?: boolean;
    custom_fields?: Record<string, any>;
  }): Promise<AsanaTask> {
    return this.makeRequest<AsanaTask>(`/tasks/${taskGid}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  async getTask(taskGid: string): Promise<AsanaTask> {
    return this.makeRequest<AsanaTask>(`/tasks/${taskGid}?opt_fields=name,assignee,assignee_status,completed,completed_at,created_at,due_at,due_on,modified_at,notes,projects,tags,custom_fields`);
  }
} 