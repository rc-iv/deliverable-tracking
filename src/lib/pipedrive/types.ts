// Basic Pipedrive API Response type
export interface PipedriveResponse<T> {
  success: boolean;
  data: T;
  additional_data?: {
    pagination?: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start?: number;
    };
  };
}

// Basic Deal interface - starting simple, will expand as needed
export interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage_id: number;
  person_id: number | null;
  org_id: number | null;
  owner_id: number;
  add_time: string;
  update_time: string;
  close_time: string | null;
  won_time: string | null;
  lost_time: string | null;
  expected_close_date: string | null;
  probability: number | null;
  next_activity_date: string | null;
  next_activity_time: string | null;
  next_activity_id: number | null;
  last_activity_id: number | null;
  last_activity_date: string | null;
  lost_reason: string | null;
  visible_to: string;
  cc_email: string;
  label: number | null;
  renewal_type: string | null;
  stage_change_time: string | null;
  active: boolean;
  deleted: boolean;
  stage_order_nr: number;
  person_name: string | null;
  org_name: string | null;
  next_activity_subject: string | null;
  next_activity_type: string | null;
  next_activity_duration: string | null;
  next_activity_note: string | null;
  formatted_value: string;
  weighted_value: number;
  formatted_weighted_value: string;
  weighted_value_currency: string;
  rotten_time: string | null;
  owner_name: string;
  cc_email_hash: string;
  products_count: number;
  files_count: number;
  notes_count: number;
  followers_count: number;
  email_messages_count: number;
  activities_count: number;
  done_activities_count: number;
  undone_activities_count: number;
  participants_count: number;
  reference_activities_count: number;
  web_form_id: number | null;
  marketing_status: string | null;
  creator_user_id: number;
  user_id: number;
  person: any;
  organization: any;
  stage: any;
  pipeline_id: number;
  first_won_time: string | null;
  pipeline: any;
  activities: any[];
  notes: any[];
  followers: any[];
  participants: any[];
  email_messages: any[];
  products: any[];
  files: any[];
  custom_fields?: any;
  // Index signature to allow custom fields with hash-like keys
  [key: string]: any;
}

// Simplified Deal interface for initial display
export interface SimpleDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage_id: number;
  owner_name: string;
  person_name: string | null;
  org_name: string | null;
  add_time: string;
  update_time: string;
  formatted_value: string;
} 