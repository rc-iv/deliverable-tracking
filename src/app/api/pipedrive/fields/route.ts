import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function GET() {
  console.log('🔬 API endpoint /api/pipedrive/fields called - fetching field definitions');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deal field definitions...');
    const response = await client.getDealFields();
    
    if (!response.success || response.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deal fields found',
        data: null
      });
    }
    
    console.log('🔬 Processing field definitions...');
    
    const fields = response.data;
    const customFields = fields.filter((field: any) => field.add_visible_flag === false);
    const standardFields = fields.filter((field: any) => field.add_visible_flag === true);
    
    // Create a mapping of field keys to names for easy lookup
    const fieldMapping = fields.reduce((acc: any, field: any) => {
      acc[field.key] = {
        name: field.name,
        type: field.field_type,
        options: field.options || null,
        is_custom: field.add_visible_flag === false
      };
      return acc;
    }, {});
    
    const result = {
      success: true,
      message: `Found ${fields.length} deal fields (${customFields.length} custom, ${standardFields.length} standard)`,
      data: {
        total_fields: fields.length,
        custom_fields_count: customFields.length,
        standard_fields_count: standardFields.length,
        custom_fields: customFields.map((field: any) => ({
          key: field.key,
          name: field.name,
          type: field.field_type,
          options: field.options || null,
          mandatory_flag: field.mandatory_flag,
          edit_flag: field.edit_flag
        })),
        field_mapping: fieldMapping,
        all_fields: fields
      }
    };
    
    console.log('✅ Field definitions processed successfully');
    console.log('📊 Field summary:', {
      total_fields: result.data.total_fields,
      custom_fields: result.data.custom_fields_count,
      standard_fields: result.data.standard_fields_count
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Field definitions fetch failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch field definitions',
      data: null
    }, { status: 500 });
  }
} 