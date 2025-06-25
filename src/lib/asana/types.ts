export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
  due_on?: string;
  assignee?: {
    gid: string;
    name: string;
  };
  projects?: Array<{
    gid: string;
    name: string;
  }>;
  custom_fields?: Array<{
    gid: string;
    name: string;
    type: string;
    text_value?: string;
    number_value?: number;
    enum_value?: {
      gid: string;
      name: string;
    };
  }>;
  created_at: string;
  modified_at: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  color?: string;
  notes?: string;
  archived: boolean;
  workspace: {
    gid: string;
    name: string;
  };
  team?: {
    gid: string;
    name: string;
  };
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  is_organization: boolean;
}

export interface AsanaUser {
  gid: string;
  name: string;
  email: string;
  photo?: {
    image_128x128: string;
  };
}

export interface AsanaOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AsanaApiResponse<T> {
  data: T;
  next_page?: {
    offset: string;
    path: string;
    uri: string;
  };
}

export interface AsanaTaskSearchParams {
  project?: string;
  assignee?: string;
  workspace?: string;
  completed_since?: string;
  opt_fields?: string;
  limit?: number;
  offset?: string;
}
