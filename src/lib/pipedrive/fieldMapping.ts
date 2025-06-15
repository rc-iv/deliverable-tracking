export interface CustomFieldDefinition {
  key: string;
  name: string;
  type: string;
  options?: any;
  is_custom: boolean;
}

export interface FieldMapping {
  [key: string]: CustomFieldDefinition;
}

// Static mapping of known custom fields based on our analysis
export const KNOWN_CUSTOM_FIELDS: FieldMapping = {
  '9af9a192cc0ca1d82ee4793ac3c7109b695936db': {
    key: '9af9a192cc0ca1d82ee4793ac3c7109b695936db',
    name: 'Deal Lead',
    type: 'user',
    is_custom: true
  },
  '6938e62f7f64d1a7c6d102f2c4d71e730dacf281': {
    key: '6938e62f7f64d1a7c6d102f2c4d71e730dacf281',
    name: 'Budget',
    type: 'enum',
    is_custom: true
  },
  'df4ec9de5dc1b54cb8701cf1646eeb6f040b6711': {
    key: 'df4ec9de5dc1b54cb8701cf1646eeb6f040b6711',
    name: 'Lead Status',
    type: 'enum',
    is_custom: true
  },
  '9877440a6cc0b573c3000052bae1e677851d3213': {
    key: '9877440a6cc0b573c3000052bae1e677851d3213',
    name: 'Preferred Method of Communication',
    type: 'enum',
    is_custom: true
  },
  '7be48f1ab7dd22aee75e655860c0e9acac6cfaee': {
    key: '7be48f1ab7dd22aee75e655860c0e9acac6cfaee',
    name: 'Lead Source',
    type: 'user',
    is_custom: true
  },
  '660ac6dabb7ea5e96165fa7f8ef1babd0cd99155': {
    key: '660ac6dabb7ea5e96165fa7f8ef1babd0cd99155',
    name: 'Conference',
    type: 'enum',
    is_custom: true
  },
  '5efaaf201386c51bb440cb624f6d679cace8d8e9': {
    key: '5efaaf201386c51bb440cb624f6d679cace8d8e9',
    name: 'Service Date Kickoff',
    type: 'date',
    is_custom: true
  },
  'de00fe2ddbb8e2c7f61ec75849010af49c827ca7': {
    key: 'de00fe2ddbb8e2c7f61ec75849010af49c827ca7',
    name: 'Transaction Hash',
    type: 'varchar',
    is_custom: true
  },
  '0ead638c506b6c232e407d5c9616cfd96814b97f': {
    key: '0ead638c506b6c232e407d5c9616cfd96814b97f',
    name: 'Payment Method',
    type: 'enum',
    is_custom: true
  },
  '1145157c2e32c3664dcb49085fcb7c32dbcde920': {
    key: '1145157c2e32c3664dcb49085fcb7c32dbcde920',
    name: 'Quickbooks Invoice Number',
    type: 'double',
    is_custom: true
  },
  '4e969805e9d6c904fecbb19e7795d2a1e60b273f': {
    key: '4e969805e9d6c904fecbb19e7795d2a1e60b273f',
    name: 'Duration (Months)',
    type: 'double',
    is_custom: true
  },
  'cf41e8410a92dffd418944de83480b8640162090': {
    key: 'cf41e8410a92dffd418944de83480b8640162090',
    name: 'TRN (Transaction Reference Number)',
    type: 'varchar',
    is_custom: true
  }
};

// Cache for dynamic field mapping from API
let dynamicFieldMapping: FieldMapping | null = null;

/**
 * Get the human-readable name for a field key
 */
export function getFieldName(key: string): string {
  // Check static mapping first
  if (KNOWN_CUSTOM_FIELDS[key]) {
    return KNOWN_CUSTOM_FIELDS[key].name;
  }
  
  // Check dynamic mapping if available
  if (dynamicFieldMapping && dynamicFieldMapping[key]) {
    return dynamicFieldMapping[key].name;
  }
  
  // Return the key itself if no mapping found
  return key;
}

/**
 * Get the field definition for a key
 */
export function getFieldDefinition(key: string): CustomFieldDefinition | null {
  // Check static mapping first
  if (KNOWN_CUSTOM_FIELDS[key]) {
    return KNOWN_CUSTOM_FIELDS[key];
  }
  
  // Check dynamic mapping if available
  if (dynamicFieldMapping && dynamicFieldMapping[key]) {
    return dynamicFieldMapping[key];
  }
  
  return null;
}

/**
 * Check if a field key is a custom field (hash-based)
 */
export function isCustomFieldKey(key: string): boolean {
  return /^[a-f0-9]{32,}$/.test(key);
}

/**
 * Extract custom fields from a deal object
 */
export function extractCustomFields(deal: any): { [key: string]: any } {
  const customFields: { [key: string]: any } = {};
  
  Object.keys(deal).forEach(key => {
    if (isCustomFieldKey(key)) {
      customFields[key] = deal[key];
    }
  });
  
  return customFields;
}

/**
 * Extract custom fields with human-readable names
 */
export function extractCustomFieldsWithNames(deal: any): { [name: string]: { key: string; value: any; type?: string } } {
  const customFields: { [name: string]: { key: string; value: any; type?: string } } = {};
  
  Object.keys(deal).forEach(key => {
    if (isCustomFieldKey(key)) {
      const name = getFieldName(key);
      const definition = getFieldDefinition(key);
      customFields[name] = {
        key,
        value: deal[key],
        type: definition?.type
      };
    }
  });
  
  return customFields;
}

/**
 * Format a custom field value based on its type
 */
export function formatCustomFieldValue(value: any, type?: string): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  switch (type) {
    case 'date':
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          return date.toLocaleDateString();
        } catch {
          return value;
        }
      }
      return String(value);
      
    case 'monetary':
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return String(value);
      
    case 'double':
    case 'int':
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      return String(value);
      
    case 'user':
      if (typeof value === 'object' && value !== null) {
        return value.name || value.email || String(value.id || value);
      }
      return String(value);
      
    case 'enum':
      return String(value);
      
    case 'varchar':
    default:
      return String(value);
  }
}

/**
 * Set dynamic field mapping from API response
 */
export function setDynamicFieldMapping(mapping: FieldMapping): void {
  dynamicFieldMapping = mapping;
  console.log('🗺️ Dynamic field mapping updated with', Object.keys(mapping).length, 'fields');
}

/**
 * Get all custom fields from a deal with formatted values
 */
export function getFormattedCustomFields(deal: any): Array<{
  key: string;
  name: string;
  value: any;
  formattedValue: string;
  type?: string;
}> {
  const customFields = extractCustomFields(deal);
  
  return Object.entries(customFields).map(([key, value]) => {
    const definition = getFieldDefinition(key);
    return {
      key,
      name: getFieldName(key),
      value,
      formattedValue: formatCustomFieldValue(value, definition?.type),
      type: definition?.type
    };
  });
}

/**
 * Get only non-empty custom fields
 */
export function getNonEmptyCustomFields(deal: any): Array<{
  key: string;
  name: string;
  value: any;
  formattedValue: string;
  type?: string;
}> {
  return getFormattedCustomFields(deal).filter(field => 
    field.value !== null && 
    field.value !== undefined && 
    field.value !== '' &&
    field.formattedValue !== '-'
  );
} 