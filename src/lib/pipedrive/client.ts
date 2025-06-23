import { PipedriveResponse, Deal } from './types';
import { setDynamicFieldMapping, type FieldMapping } from './fieldMapping';

export class PipedriveClient {
  private readonly apiToken: string;
  private readonly baseUrl: string = 'https://api.pipedrive.com/v1';
  private fieldMappingLoaded: boolean = false;

  constructor() {
    console.log('🔧 Initializing PipedriveClient...');
    
    const token = process.env.PIPEDRIVE_API_TOKEN;
    if (!token) {
      console.error('❌ PIPEDRIVE_API_TOKEN environment variable is not set');
      throw new Error('PIPEDRIVE_API_TOKEN environment variable is required');
    }
    
    this.apiToken = token;
    console.log('✅ PipedriveClient initialized with API token');
    
    // Initialize field mapping in the background
    this.initializeFieldMapping().catch(error => {
      console.warn('⚠️ Failed to initialize field mapping:', error.message);
    });
  }

  private async initializeFieldMapping(): Promise<void> {
    if (this.fieldMappingLoaded) {
      return;
    }

    try {
      console.log('🗺️ Loading field mapping...');
      const response = await this.getDealFields();
      
      if (response.success && response.data) {
        // Convert field array to mapping object
        const fieldMapping: FieldMapping = {};
        response.data.forEach((field: any) => {
          fieldMapping[field.key] = {
            key: field.key,
            name: field.name,
            type: field.field_type,
            options: field.options,
            is_custom: field.add_visible_flag === false
          };
        });
        
        setDynamicFieldMapping(fieldMapping);
        this.fieldMappingLoaded = true;
        console.log('✅ Field mapping loaded successfully');
      }
    } catch (error) {
      console.warn('⚠️ Field mapping initialization failed:', error);
      // Don't throw - field mapping is optional
    }
  }

  async testConnection() {
    const endpoint = '/users/me';
    const url = `${this.baseUrl}${endpoint}?api_token=${this.apiToken}`;
    
    console.log('🔍 Testing Pipedrive API connection...');
    console.log('📡 Request URL:', `${this.baseUrl}${endpoint}?api_token=***`);
    
    try {
      console.log('⏳ Making request to Pipedrive API...');
      const response = await fetch(url);
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Raw response data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ API request failed');
        console.error('❌ Error data:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ API connection successful');
      console.log('👤 User info:', {
        name: data.data?.name,
        email: data.data?.email,
        company: data.data?.company_name
      });
      
      return {
        success: true,
        message: 'Successfully connected to Pipedrive API',
        data: data.data
      };
    } catch (error) {
      console.error('💥 Pipedrive API connection failed');
      console.error('💥 Error details:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection');
      }
      
      throw error;
    }
  }

  async getDeals(
    limit: number = 100, 
    start: number = 0, 
    status: 'open' | 'won' | 'lost' | 'all_not_deleted' = 'open'
  ): Promise<PipedriveResponse<Deal[]>> {
    // Ensure field mapping is loaded
    await this.initializeFieldMapping();
    
    const endpoint = '/deals';
    const params = new URLSearchParams({
      api_token: this.apiToken,
      limit: limit.toString(),
      start: start.toString(),
      status: status
    });
    const url = `${this.baseUrl}${endpoint}?${params}`;
    
    console.log('🔍 Fetching deals from Pipedrive...');
    console.log('📡 Request URL:', `${this.baseUrl}${endpoint}?api_token=***&limit=${limit}&start=${start}&status=${status}`);
    console.log('📊 Request params:', { limit, start, status });
    
    try {
      console.log('⏳ Making request to Pipedrive API...');
      const response = await fetch(url);
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Raw response structure:', {
        success: data.success,
        data_length: Array.isArray(data.data) ? data.data.length : 'not array',
        additional_data: data.additional_data ? 'present' : 'missing'
      });
      
      if (!response.ok) {
        console.error('❌ API request failed');
        console.error('❌ Error data:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rawDeals = Array.isArray(data.data) ? data.data : [];
      
      // Filter out archived/deleted deals - never show these
      const filteredDeals = rawDeals.filter((deal: any) => {
        const isNotDeleted = !deal.deleted;
        const isNotArchived = deal.status !== 'deleted';
        return isNotDeleted && isNotArchived;
      });
      
      console.log('✅ Deals fetched and filtered successfully');
      console.log('📈 Deal summary:', {
        raw_deals: rawDeals.length,
        filtered_deals: filteredDeals.length,
        archived_removed: rawDeals.length - filteredDeals.length,
        status_filter: status,
        first_deal_title: filteredDeals[0]?.title || 'No deals',
        pagination: data.additional_data?.pagination
      });
      
      // Log first deal structure for debugging
      if (filteredDeals.length > 0) {
        const firstDeal = filteredDeals[0];
        console.log('🔍 First deal structure:', {
          id: firstDeal.id,
          title: firstDeal.title,
          value: firstDeal.value,
          currency: firstDeal.currency,
          status: firstDeal.status,
          deleted: firstDeal.deleted,
          active: firstDeal.active,
          owner_name: firstDeal.owner_name,
          person_name: firstDeal.person_name,
          org_name: firstDeal.org_name
        });
        
        // Log ALL properties to identify custom fields
        console.log('🔍 COMPLETE first deal object (for custom field analysis):');
        console.log(JSON.stringify(firstDeal, null, 2));
        
        // Identify potential custom fields (properties that look like custom field keys)
        const allKeys = Object.keys(firstDeal);
        const customFieldKeys = allKeys.filter(key => {
          // Pipedrive custom fields often have specific patterns:
          // - Contain hash/ID-like strings
          // - Are not standard Pipedrive fields
          // - May contain underscores or specific prefixes
          const isStandardField = [
            'id', 'title', 'value', 'currency', 'status', 'stage_id', 'person_id', 'org_id', 'owner_id',
            'add_time', 'update_time', 'close_time', 'won_time', 'lost_time', 'expected_close_date',
            'probability', 'next_activity_date', 'next_activity_time', 'next_activity_id', 'last_activity_id',
            'last_activity_date', 'lost_reason', 'visible_to', 'cc_email', 'label', 'renewal_type',
            'stage_change_time', 'active', 'deleted', 'stage_order_nr', 'person_name', 'org_name',
            'next_activity_subject', 'next_activity_type', 'next_activity_duration', 'next_activity_note',
            'formatted_value', 'weighted_value', 'formatted_weighted_value', 'weighted_value_currency',
            'rotten_time', 'owner_name', 'cc_email_hash', 'products_count', 'files_count', 'notes_count',
            'followers_count', 'email_messages_count', 'activities_count', 'done_activities_count',
            'undone_activities_count', 'participants_count', 'reference_activities_count', 'web_form_id',
            'marketing_status', 'creator_user_id', 'user_id', 'person', 'organization', 'stage',
            'pipeline_id', 'won_time', 'first_won_time', 'lost_time', 'close_time', 'pipeline',
            'activities', 'notes', 'followers', 'participants', 'email_messages'
          ].includes(key);
          
          // Look for hash-like patterns (common in Pipedrive custom fields)
          const hasHashPattern = /^[a-f0-9]{32}$/.test(key) || /^[a-f0-9]{8,}/.test(key);
          
          return !isStandardField || hasHashPattern;
        });
        
        console.log('🎯 Potential custom field keys found:', customFieldKeys);
        
        if (customFieldKeys.length > 0) {
          console.log('🎯 Custom field values:');
          customFieldKeys.forEach(key => {
            const value = firstDeal[key];
            console.log(`  ${key}:`, typeof value, value);
          });
        } else {
          console.log('🎯 No obvious custom fields detected in standard properties');
        }
        
        // Check if there's a specific custom_fields property or similar
        if (firstDeal.custom_fields) {
          console.log('🎯 Found custom_fields property:', firstDeal.custom_fields);
        }
        
        // Look for any property that contains objects (custom fields are often objects)
        const objectProperties = allKeys.filter(key => {
          const value = firstDeal[key];
          return value && typeof value === 'object' && !Array.isArray(value) && value !== null;
        });
        
        console.log('🎯 Object-type properties (potential custom fields):', objectProperties);
        objectProperties.forEach(key => {
          console.log(`  ${key}:`, firstDeal[key]);
        });
      }
      
      // Log any archived deals that were filtered out
      const archivedDeals = rawDeals.filter((deal: any) => deal.deleted || deal.status === 'deleted');
      if (archivedDeals.length > 0) {
        console.log('🗑️ Filtered out archived deals:', archivedDeals.map((deal: any) => ({
          id: deal.id,
          title: deal.title,
          deleted: deal.deleted,
          status: deal.status
        })));
      }
      
      return {
        success: true,
        data: filteredDeals,
        additional_data: data.additional_data
      };
    } catch (error) {
      console.error('💥 Deal fetching failed');
      console.error('💥 Error details:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection');
      }
      
      throw error;
    }
  }

  async getDeal(id: number): Promise<PipedriveResponse<Deal>> {
    // Ensure field mapping is loaded
    await this.initializeFieldMapping();
    
    const endpoint = `/deals/${id}`;
    const params = new URLSearchParams({
      api_token: this.apiToken
    });
    const url = `${this.baseUrl}${endpoint}?${params}`;
    
    console.log('🔍 Fetching single deal from Pipedrive...');
    console.log('📡 Request URL:', `${this.baseUrl}${endpoint}?api_token=***`);
    console.log('📊 Deal ID:', id);
    
    try {
      console.log('⏳ Making request to Pipedrive API...');
      const response = await fetch(url);
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Raw response structure:', {
        success: data.success,
        has_data: !!data.data,
        data_type: data.data ? typeof data.data : 'none'
      });
      
      if (!response.ok) {
        console.error('❌ API request failed');
        console.error('❌ Error data:', data);
        
        // Handle specific 404 case for non-existent deals
        if (response.status === 404) {
          throw new Error(`Deal with ID ${id} not found`);
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const deal = data.data;
      
      if (!deal) {
        console.error('❌ No deal data returned');
        throw new Error(`Deal with ID ${id} not found`);
      }
      
      // Check if deal is deleted/archived
      if (deal.deleted || deal.status === 'deleted') {
        console.warn('⚠️ Deal is deleted/archived:', {
          id: deal.id,
          title: deal.title,
          deleted: deal.deleted,
          status: deal.status
        });
        throw new Error(`Deal with ID ${id} is deleted or archived`);
      }
      
      console.log('✅ Deal fetched successfully');
      console.log('📈 Deal summary:', {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        status: deal.status,
        owner_name: deal.owner_name,
        person_name: deal.person_name,
        org_name: deal.org_name
      });
      
      // Log detailed deal structure for debugging
      console.log('🔍 Complete deal object structure:');
      console.log(JSON.stringify(deal, null, 2));
      
      return {
        success: true,
        data: deal,
        additional_data: data.additional_data
      };
    } catch (error) {
      console.error('💥 Single deal fetching failed');
      console.error('💥 Error details:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection');
      }
      
      throw error;
    }
  }

  async getDealFields(): Promise<PipedriveResponse<any[]>> {
    const endpoint = '/dealFields';
    const params = new URLSearchParams({
      api_token: this.apiToken
    });
    const url = `${this.baseUrl}${endpoint}?${params}`;
    
    console.log('🔍 Fetching deal field definitions from Pipedrive...');
    console.log('📡 Request URL:', `${this.baseUrl}${endpoint}?api_token=***`);
    
    try {
      console.log('⏳ Making request to Pipedrive API...');
      const response = await fetch(url);
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      
      const data = await response.json();
      console.log('📦 Raw response structure:', {
        success: data.success,
        data_length: Array.isArray(data.data) ? data.data.length : 'not array'
      });
      
      if (!response.ok) {
        console.error('❌ API request failed');
        console.error('❌ Error data:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const fields = Array.isArray(data.data) ? data.data : [];
      
      console.log('✅ Deal fields fetched successfully');
      console.log('📈 Field summary:', {
        total_fields: fields.length,
        custom_fields: fields.filter((field: any) => field.add_visible_flag === false).length,
        standard_fields: fields.filter((field: any) => field.add_visible_flag === true).length
      });
      
      // Log custom fields for debugging
      const customFields = fields.filter((field: any) => field.add_visible_flag === false);
      if (customFields.length > 0) {
        console.log('🎯 Custom fields found:');
        customFields.forEach((field: any) => {
          console.log(`  ${field.key}: ${field.name} (${field.field_type})`);
        });
      }
      
      return {
        success: true,
        data: fields,
        additional_data: data.additional_data
      };
    } catch (error) {
      console.error('💥 Deal fields fetching failed');
      console.error('💥 Error details:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection');
      }
      
      throw error;
    }
  }

  async updateDeal(id: number, updates: Record<string, any>): Promise<PipedriveResponse<Deal>> {
    // Ensure field mapping is loaded
    await this.initializeFieldMapping();
    
    const endpoint = `/deals/${id}`;
    const params = new URLSearchParams({
      api_token: this.apiToken
    });
    const url = `${this.baseUrl}${endpoint}?${params}`;
    
    console.log('🔄 Updating deal in Pipedrive...');
    console.log('📡 Request URL:', `${this.baseUrl}${endpoint}?api_token=***`);
    console.log('📊 Deal ID:', id);
    console.log('📝 Updates:', Object.keys(updates).length, 'fields to update');
    
    // Log the fields being updated (without sensitive values)
    const updateSummary = Object.keys(updates).map(key => ({
      field: key,
      hasValue: updates[key] !== null && updates[key] !== undefined,
      valueType: typeof updates[key]
    }));
    console.log('📝 Update summary:', updateSummary);
    
    try {
      console.log('⏳ Making PUT request to Pipedrive API...');
      
      // Use JSON format for the request body (required for custom fields)
      const requestBody = JSON.stringify(updates);
      
      console.log('📦 Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Raw response structure:', {
        success: data.success,
        has_data: !!data.data,
        data_type: data.data ? typeof data.data : 'none'
      });
      
      if (!response.ok) {
        console.error('❌ API request failed');
        console.error('❌ Error data:', data);
        
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error(`Deal with ID ${id} not found`);
        }
        
        if (response.status === 400) {
          throw new Error(`Invalid update data: ${data.error || 'Bad request'}`);
        }
        
        if (response.status === 403) {
          throw new Error(`Permission denied: Cannot update deal ${id}`);
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const deal = data.data;
      
      if (!deal) {
        console.error('❌ No deal data returned after update');
        throw new Error(`Failed to update deal with ID ${id}`);
      }
      
      console.log('✅ Deal updated successfully');
      console.log('📈 Updated deal summary:', {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        status: deal.status,
        update_time: deal.update_time,
        owner_name: deal.owner_name
      });
      
      // Log which fields were actually updated
      const updatedFields = Object.keys(updates).filter(key => {
        const newValue = deal[key];
        const sentValue = updates[key];
        return newValue !== undefined; // Field exists in response
      });
      
      console.log('✅ Fields confirmed updated:', updatedFields.length, 'of', Object.keys(updates).length);
      
      return {
        success: true,
        data: deal,
        additional_data: data.additional_data
      };
    } catch (error) {
      console.error('💥 Deal update failed');
      console.error('💥 Error details:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection');
      }
      
      throw error;
    }
  }
} 