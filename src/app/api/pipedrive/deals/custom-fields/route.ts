import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';
import { 
  getFormattedCustomFields, 
  getNonEmptyCustomFields, 
  extractCustomFieldsWithNames,
  getFieldName 
} from '@/lib/pipedrive/fieldMapping';

export async function GET(request: Request) {
  console.log('🎯 API endpoint /api/pipedrive/deals/custom-fields called - testing custom field mapping');
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '5');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deals with custom field mapping...');
    const response = await client.getDeals(limit, 0, 'open');
    
    if (!response.success || response.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deals found',
        data: null
      });
    }
    
    console.log('🎯 Processing custom fields for', response.data.length, 'deals...');
    
    const dealsWithCustomFields = response.data.map(deal => {
      const allCustomFields = getFormattedCustomFields(deal);
      const nonEmptyCustomFields = getNonEmptyCustomFields(deal);
      const customFieldsWithNames = extractCustomFieldsWithNames(deal);
      
      console.log(`🎯 Deal "${deal.title}" custom fields:`, {
        total_custom_fields: allCustomFields.length,
        non_empty_custom_fields: nonEmptyCustomFields.length,
        custom_field_names: nonEmptyCustomFields.map(f => f.name)
      });
      
      return {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        status: deal.status,
        person_name: deal.person_name,
        org_name: deal.org_name,
        custom_fields: {
          all: allCustomFields,
          non_empty: nonEmptyCustomFields,
          with_names: customFieldsWithNames
        }
      };
    });
    
    // Summary statistics
    const totalCustomFields = dealsWithCustomFields.reduce((sum, deal) => 
      sum + deal.custom_fields.all.length, 0
    );
    const totalNonEmptyCustomFields = dealsWithCustomFields.reduce((sum, deal) => 
      sum + deal.custom_fields.non_empty.length, 0
    );
    
    const result = {
      success: true,
      message: `Successfully processed ${response.data.length} deals with custom field mapping`,
      data: {
        deals: dealsWithCustomFields,
        summary: {
          total_deals: response.data.length,
          total_custom_fields: totalCustomFields,
          total_non_empty_custom_fields: totalNonEmptyCustomFields,
          avg_custom_fields_per_deal: Math.round(totalCustomFields / response.data.length * 100) / 100,
          avg_non_empty_custom_fields_per_deal: Math.round(totalNonEmptyCustomFields / response.data.length * 100) / 100
        }
      }
    };
    
    console.log('✅ Custom field mapping test complete');
    console.log('📊 Summary:', result.data.summary);
    
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