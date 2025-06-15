import { NextResponse } from 'next/server';
import { PipedriveClient } from '@/lib/pipedrive/client';

export async function GET() {
  console.log('🔬 API endpoint /api/pipedrive/deals/analyze called - analyzing custom fields');
  
  try {
    console.log('🔧 Creating PipedriveClient instance...');
    const client = new PipedriveClient();
    
    console.log('🔍 Fetching deals for analysis...');
    const response = await client.getDeals(5, 0, 'open'); // Get just 5 deals for analysis
    
    if (!response.success || response.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No deals found for analysis',
        data: null
      });
    }
    
    console.log('🔬 Analyzing custom fields across', response.data.length, 'deals...');
    
    const analysis = {
      total_deals_analyzed: response.data.length,
      all_properties: new Set<string>(),
      custom_field_candidates: new Map<string, any>(),
      object_properties: new Map<string, any>(),
      hash_like_properties: new Map<string, any>(),
      sample_deals: response.data.map(deal => ({
        id: deal.id,
        title: deal.title,
        all_keys: Object.keys(deal),
        custom_fields_property: deal.custom_fields || null
      }))
    };
    
    // Analyze each deal
    response.data.forEach((deal, index) => {
      console.log(`🔬 Analyzing deal ${index + 1}: ${deal.title} (ID: ${deal.id})`);
      
      const allKeys = Object.keys(deal);
      allKeys.forEach(key => analysis.all_properties.add(key));
      
      // Standard Pipedrive fields (comprehensive list)
      const standardFields = new Set([
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
        'pipeline_id', 'first_won_time', 'pipeline', 'activities', 'notes', 'followers', 
        'participants', 'email_messages', 'products', 'files'
      ]);
      
      allKeys.forEach(key => {
        const value = deal[key];
        
        // Check if it's a potential custom field
        if (!standardFields.has(key)) {
          if (!analysis.custom_field_candidates.has(key)) {
            analysis.custom_field_candidates.set(key, {
              key,
              type: typeof value,
              sample_values: [],
              appears_in_deals: []
            });
          }
          
          const fieldInfo = analysis.custom_field_candidates.get(key);
          fieldInfo.sample_values.push(value);
          fieldInfo.appears_in_deals.push(deal.id);
        }
        
        // Check if it's an object (common for custom fields)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if (!analysis.object_properties.has(key)) {
            analysis.object_properties.set(key, {
              key,
              sample_values: [],
              appears_in_deals: []
            });
          }
          
          const objInfo = analysis.object_properties.get(key);
          objInfo.sample_values.push(value);
          objInfo.appears_in_deals.push(deal.id);
        }
        
        // Check for hash-like patterns (Pipedrive custom field IDs)
        if (/^[a-f0-9]{8,}/.test(key)) {
          if (!analysis.hash_like_properties.has(key)) {
            analysis.hash_like_properties.set(key, {
              key,
              type: typeof value,
              sample_values: [],
              appears_in_deals: []
            });
          }
          
          const hashInfo = analysis.hash_like_properties.get(key);
          hashInfo.sample_values.push(value);
          hashInfo.appears_in_deals.push(deal.id);
        }
      });
    });
    
    // Convert Maps to Objects for JSON response
    const result = {
      success: true,
      message: `Analyzed ${analysis.total_deals_analyzed} deals for custom fields`,
      data: {
        total_deals_analyzed: analysis.total_deals_analyzed,
        all_properties: Array.from(analysis.all_properties).sort(),
        custom_field_candidates: Array.from(analysis.custom_field_candidates.values()),
        object_properties: Array.from(analysis.object_properties.values()),
        hash_like_properties: Array.from(analysis.hash_like_properties.values()),
        sample_deals: analysis.sample_deals
      }
    };
    
    console.log('✅ Custom field analysis complete');
    console.log('📊 Analysis summary:', {
      total_properties: result.data.all_properties.length,
      custom_field_candidates: result.data.custom_field_candidates.length,
      object_properties: result.data.object_properties.length,
      hash_like_properties: result.data.hash_like_properties.length
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Custom field analysis failed');
    console.error('💥 Error details:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze custom fields',
      data: null
    }, { status: 500 });
  }
} 