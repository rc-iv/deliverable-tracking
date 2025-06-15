import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { 
  getFormattedCustomFields, 
  getNonEmptyCustomFields, 
  extractCustomFieldsWithNames 
} from '@/lib/pipedrive/fieldMapping';

export async function GET() {
  console.log('🧪 API endpoint /api/pipedrive/deals/test-custom-fields called - testing with mock data');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching a real deal and adding mock custom field data...');
    const response = await client.getDeals(1, 0, 'open');
    
    if (!response.success || response.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deals found to test with',
        data: null
      });
    }
    
    // Take the first deal and add some mock custom field values
    const originalDeal = response.data[0];
    const mockDeal = {
      ...originalDeal,
      // Add some mock values to existing custom fields
      'df4ec9de5dc1b54cb8701cf1646eeb6f040b6711': 'Hot Lead', // Lead Status
      '9877440a6cc0b573c3000052bae1e677851d3213': 'Email', // Preferred Method of Communication
      'de00fe2ddbb8e2c7f61ec75849010af49c827ca7': '0x1234567890abcdef', // Transaction Hash
      '1145157c2e32c3664dcb49085fcb7c32dbcde920': 12345, // Quickbooks Invoice Number
      '4e969805e9d6c904fecbb19e7795d2a1e60b273f': 6, // Duration (Months)
      '5efaaf201386c51bb440cb624f6d679cace8d8e9': '2024-01-15', // Service Date Kickoff
      '0ead638c506b6c232e407d5c9616cfd96814b97f': 'Credit Card', // Payment Method
    };
    
    console.log('🎯 Processing mock deal with custom field values...');
    
    const allCustomFields = getFormattedCustomFields(mockDeal);
    const nonEmptyCustomFields = getNonEmptyCustomFields(mockDeal);
    const customFieldsWithNames = extractCustomFieldsWithNames(mockDeal);
    
    console.log(`🎯 Mock deal "${mockDeal.title}" custom fields:`, {
      total_custom_fields: allCustomFields.length,
      non_empty_custom_fields: nonEmptyCustomFields.length,
      custom_field_names: nonEmptyCustomFields.map(f => f.name)
    });
    
    const result = {
      success: true,
      message: `Successfully tested custom field mapping with mock data`,
      data: {
        original_deal: {
          id: originalDeal.id,
          title: originalDeal.title,
          value: originalDeal.value,
          currency: originalDeal.currency,
          status: originalDeal.status,
          person_name: originalDeal.person_name,
          org_name: originalDeal.org_name
        },
        mock_deal_with_custom_fields: {
          id: mockDeal.id,
          title: mockDeal.title,
          value: mockDeal.value,
          currency: mockDeal.currency,
          status: mockDeal.status,
          person_name: mockDeal.person_name,
          org_name: mockDeal.org_name,
          custom_fields: {
            all: allCustomFields,
            non_empty: nonEmptyCustomFields,
            with_names: customFieldsWithNames
          }
        },
        demo_ui_data: {
          // This is what the UI component would receive
          ...mockDeal,
          formatted_custom_fields: nonEmptyCustomFields
        }
      }
    };
    
    console.log('✅ Custom field mapping test with mock data complete');
    console.log('📊 Non-empty custom fields:', nonEmptyCustomFields.length);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Custom field mapping test failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test custom field mapping',
      data: null
    }, { status: 500 });
  }
} 