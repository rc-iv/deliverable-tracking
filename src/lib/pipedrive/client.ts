export class PipedriveClient {
  private readonly apiToken: string;
  private readonly baseUrl: string = 'https://api.pipedrive.com/v1';

  constructor() {
    console.log('🔧 Initializing PipedriveClient...');
    
    const apiToken = process.env.PIPEDRIVE_API_TOKEN;
    if (!apiToken) {
      console.error('❌ PIPEDRIVE_API_TOKEN environment variable is not set');
      throw new Error('PIPEDRIVE_API_TOKEN environment variable is not set');
    }
    
    this.apiToken = apiToken;
    console.log('✅ PipedriveClient initialized with API token');
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
} 