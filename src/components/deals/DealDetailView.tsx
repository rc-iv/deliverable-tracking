'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Deal } from '@/lib/pipedrive/types';
import { EditableField, FieldValidation } from './EditableField';
import { InvoiceLinkingSection } from './InvoiceLinkingSection';

interface FormattedCustomField {
  key: string;
  name: string;
  value: any;
  formattedValue: string;
  fieldType: string;
}

interface DealDetailViewProps {
  deal: Deal & {
    formatted_custom_fields?: FormattedCustomField[];
  };
  onRefresh?: () => void;
  onEdit?: () => void;
  onSave?: (updates: Record<string, any>) => Promise<void>;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

function CollapsibleSection({ title, children, defaultOpen = true, icon, isEditing, onToggleEdit }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-left hover:text-gray-700 transition-colors flex-1"
        >
          {icon}
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {onToggleEdit && (
          <button
            onClick={onToggleEdit}
            className={`ml-3 px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              isEditing 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
        
        {isEditing && !onToggleEdit && (
          <span className="ml-3 px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-lg">
            Editing
          </span>
        )}
      </div>
      
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'currency' | 'date' | 'email' | 'url';
  currency?: string;
}

function Field({ label, value, type = 'text', currency = 'USD' }: FieldProps) {
  const formatValue = (val: any, fieldType: string) => {
    if (val === null || val === undefined || val === '') return 'N/A';
    
    switch (fieldType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(Number(val));
      
      case 'date':
        return new Date(val).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'email':
        return val;
      
      case 'url':
        return val;
      
      default:
        return String(val);
    }
  };

  const formattedValue = formatValue(value, type);
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
      <dt className="text-sm font-medium text-gray-500 sm:w-1/3">{label}</dt>
      <dd className="text-sm text-gray-900 sm:w-2/3">
        {type === 'email' && formattedValue !== 'N/A' ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800">
            {formattedValue}
          </a>
        ) : type === 'url' && formattedValue !== 'N/A' ? (
          <a 
            href={String(value)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            {formattedValue}
          </a>
        ) : (
          <span className={formattedValue === 'N/A' ? 'text-gray-400 italic' : ''}>
            {formattedValue}
          </span>
        )}
      </dd>
    </div>
  );
}

export function DealDetailView({ deal, onRefresh, onEdit, onSave }: DealDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'cancel' | 'exit' | null>(null);
  const [optimisticData, setOptimisticData] = useState<Record<string, any>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Format currency
  const formatValue = (value: number, currency: string) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle field changes
  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Optimistic update for immediate UI feedback
    setOptimisticData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    setHasChanges(true);
    setSaveSuccess(false); // Reset success state when making new changes
  };

  // Toggle global edit mode
  const toggleGlobalEdit = () => {
    if (isEditing && hasChanges) {
      setPendingAction('cancel');
      setShowConfirmDialog(true);
      return;
    }
    
    if (isEditing) {
      // Exit edit mode
      setIsEditing(false);
      setEditingSections({});
      setFormData({});
      setOptimisticData({});
      setHasChanges(false);
    } else {
      // Enter global edit mode - enable all sections
      setIsEditing(true);
      setEditingSections({
        header: true,
        basic: true,
        contact: true,
        financial: true,
        custom_Lead_Information: true,
        custom_Financial: true,
        custom_Communication: true,
        custom_Timeline: true,
        custom_Other: true
      });
    }
  };

  // Toggle section edit mode
  const toggleSectionEdit = (sectionKey: string) => {
    if (editingSections[sectionKey] && hasChanges) {
      setPendingAction('cancel');
      setShowConfirmDialog(true);
      return;
    }
    
    setEditingSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle save with optimistic updates
  const handleSave = async () => {
    if (!onSave || !hasChanges) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      console.log('💾 Saving deal updates:', formData);
      
      // Show optimistic updates immediately
      const optimisticUpdates = { ...formData };
      
      await onSave(optimisticUpdates);
      
      // Success feedback
      setSaveSuccess(true);
      setEditingSections({});
      setFormData({});
      setOptimisticData({});
      setHasChanges(false);
      setIsEditing(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Deal saved successfully with optimistic updates');
      
    } catch (error) {
      console.error('💥 Error saving deal:', error);
      // Revert optimistic updates on error
      setOptimisticData({});
      // Error handling will be managed by parent component
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (hasChanges) {
      setPendingAction('cancel');
      setShowConfirmDialog(true);
    } else {
      performCancel();
    }
  };

  // Perform cancel action
  const performCancel = () => {
    setEditingSections({});
    setFormData({});
    setOptimisticData({});
    setHasChanges(false);
    setIsEditing(false);
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // Handle confirmation dialog
  const handleConfirmAction = () => {
    if (pendingAction === 'cancel') {
      performCancel();
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // Get display value (with optimistic updates)
  const getDisplayValue = (fieldKey: string, originalValue: any) => {
    return optimisticData[fieldKey] !== undefined ? optimisticData[fieldKey] : originalValue;
  };

  // Field validation rules
  const getFieldValidation = (fieldKey: string): FieldValidation => {
    const validationRules: Record<string, FieldValidation> = {
      title: {
        required: true,
        minLength: 1,
        maxLength: 255
      },
      value: {
        min: 0,
        max: 999999999
      },
      probability: {
        min: 0,
        max: 100
      }
    };
    
    return validationRules[fieldKey] || {};
  };

  // Group custom fields by category
  const groupCustomFields = (customFields: FormattedCustomField[]) => {
    const groups: { [key: string]: FormattedCustomField[] } = {
      'Lead Information': [],
      'Financial': [],
      'Communication': [],
      'Timeline': [],
      'Other': []
    };

    customFields.forEach(field => {
      const name = field.name.toLowerCase();
      if (name.includes('lead') || name.includes('status') || name.includes('source')) {
        groups['Lead Information'].push(field);
      } else if (name.includes('budget') || name.includes('payment') || name.includes('invoice') || name.includes('transaction')) {
        groups['Financial'].push(field);
      } else if (name.includes('communication') || name.includes('method') || name.includes('conference')) {
        groups['Communication'].push(field);
      } else if (name.includes('date') || name.includes('duration') || name.includes('kickoff')) {
        groups['Timeline'].push(field);
      } else {
        groups['Other'].push(field);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, fields]) => fields.length > 0);
  };

  const customFieldGroups = deal.formatted_custom_fields 
    ? groupCustomFields(deal.formatted_custom_fields)
    : [];

  const isAnyEditing = Object.values(editingSections).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">Changes Saved Successfully!</h3>
            <p className="text-sm text-green-700">Your deal updates have been saved to Pipedrive.</p>
          </div>
        </div>
      )}

      {/* Global Edit Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editing Mode Active' : 'Deal Information'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing 
                  ? `${Object.values(editingSections).filter(Boolean).length} sections enabled for editing`
                  : 'Click to edit all sections at once'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Unsaved Changes
              </span>
            )}
            
            <button
              onClick={toggleGlobalEdit}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isEditing 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Exit Edit Mode
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit All Sections
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deal Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <EditableField
              label="Deal Title"
              value={getDisplayValue('title', deal.title)}
              type="text"
              fieldKey="title"
              isEditing={editingSections.header}
              onChange={handleFieldChange}
              validation={getFieldValidation('title')}
              isRequired={true}
            />
            <p className="text-gray-500 mt-2">Deal ID: {deal.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(deal.status)}`}>
            {deal.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <EditableField
              label="Deal Value"
              value={getDisplayValue('value', deal.value)}
              type="currency"
              fieldKey="value"
              isEditing={editingSections.header}
              onChange={handleFieldChange}
              validation={getFieldValidation('value')}
              currency={deal.currency}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
            <p className="text-lg text-gray-900">{deal.owner_name || 'N/A'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
            <p className="text-lg text-gray-900">
              {deal.update_time ? new Date(deal.update_time).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Header edit controls - only show if not in global edit mode */}
        {!isEditing && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => toggleSectionEdit('header')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                editingSections.header 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {editingSections.header ? 'Cancel' : 'Edit Header'}
            </button>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <CollapsibleSection 
        title="Basic Information" 
        defaultOpen={true}
        isEditing={editingSections.basic}
        onToggleEdit={!isEditing ? () => toggleSectionEdit('basic') : undefined}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <EditableField
            label="Status"
            value={getDisplayValue('status', deal.status)}
            type="enum"
            fieldKey="status"
            isEditing={editingSections.basic}
            onChange={handleFieldChange}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' }
            ]}
            isReadOnly={true}
          />
          <Field label="Pipeline ID" value={deal.pipeline_id} />
          <Field label="Stage ID" value={deal.stage_id} />
          <EditableField
            label="Probability"
            value={getDisplayValue('probability', deal.probability)}
            type="number"
            fieldKey="probability"
            isEditing={editingSections.basic}
            onChange={handleFieldChange}
            validation={getFieldValidation('probability')}
            helpText="Percentage (0-100)"
          />
          <EditableField
            label="Expected Close Date"
            value={getDisplayValue('expected_close_date', deal.expected_close_date)}
            type="date"
            fieldKey="expected_close_date"
            isEditing={editingSections.basic}
            onChange={handleFieldChange}
          />
          <Field label="Lost Reason" value={deal.lost_reason} />
        </dl>
      </CollapsibleSection>

      {/* Contact Information */}
      <CollapsibleSection 
        title="Contact Information" 
        defaultOpen={true}
        isEditing={editingSections.contact}
        onToggleEdit={!isEditing ? () => toggleSectionEdit('contact') : undefined}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <Field label="Contact Person" value={deal.person_name} />
          <Field label="Organization" value={deal.org_name} />
          <Field label="Owner" value={deal.owner_name} />
          <Field label="Creator" value={(deal.creator_user_id as any)?.name || deal.creator_user_id} />
        </dl>
      </CollapsibleSection>

      {/* Financial Information */}
      <CollapsibleSection 
        title="Financial Information" 
        defaultOpen={true}
        isEditing={editingSections.financial}
        onToggleEdit={!isEditing ? () => toggleSectionEdit('financial') : undefined}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <Field label="Deal Value" value={getDisplayValue('value', deal.value)} type="currency" currency={deal.currency} />
          <Field label="Currency" value={deal.currency} />
          <Field label="Formatted Value" value={deal.formatted_value} />
          <Field label="Weighted Value" value={deal.weighted_value} type="currency" currency={deal.currency} />
        </dl>
      </CollapsibleSection>

      {/* Invoice Linking Section */}
      <InvoiceLinkingSection deal={deal} />

      {/* Timeline Information */}
      <CollapsibleSection 
        title="Timeline Information" 
        defaultOpen={false}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <Field label="Created Date" value={deal.add_time} type="date" />
          <Field label="Last Updated" value={deal.update_time} type="date" />
          <Field label="Stage Changed" value={deal.stage_change_time} type="date" />
          <Field label="Close Time" value={deal.close_time} type="date" />
          <Field label="Won Time" value={deal.won_time} type="date" />
          <Field label="Lost Time" value={deal.lost_time} type="date" />
        </dl>
      </CollapsibleSection>

      {/* Activity Information */}
      <CollapsibleSection 
        title="Activity Information" 
        defaultOpen={false}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <Field label="Next Activity Date" value={deal.next_activity_date} type="date" />
          <Field label="Next Activity Subject" value={deal.next_activity_subject} />
          <Field label="Activities Count" value={deal.activities_count} />
          <Field label="Done Activities" value={deal.done_activities_count} />
          <Field label="Undone Activities" value={deal.undone_activities_count} />
          <Field label="Notes Count" value={deal.notes_count} />
          <Field label="Files Count" value={deal.files_count} />
          <Field label="Email Messages Count" value={deal.email_messages_count} />
        </dl>
      </CollapsibleSection>

      {/* Custom Fields Groups */}
      {customFieldGroups.map(([groupName, fields]) => (
        <CollapsibleSection 
          key={groupName}
          title={`Custom Fields - ${groupName}`} 
          defaultOpen={groupName === 'Lead Information'}
          isEditing={editingSections[`custom_${groupName}`]}
          onToggleEdit={!isEditing ? () => toggleSectionEdit(`custom_${groupName}`) : undefined}
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <dl className="divide-y divide-gray-100">
            {fields.map((field) => (
              <EditableField
                key={field.key}
                label={field.name}
                value={getDisplayValue(field.key, field.value)}
                type={field.fieldType === 'enum' ? 'enum' : 'text'}
                fieldKey={field.key}
                isEditing={editingSections[`custom_${groupName}`]}
                onChange={handleFieldChange}
                helpText={`Type: ${field.fieldType}`}
              />
            ))}
          </dl>
        </CollapsibleSection>
      ))}

      {/* System Information */}
      <CollapsibleSection 
        title="System Information" 
        defaultOpen={false}
        icon={
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        }
      >
        <dl className="divide-y divide-gray-100">
          <Field label="Visible To" value={deal.visible_to} />
          <Field label="Active" value={deal.active ? 'Yes' : 'No'} />
          <Field label="Deleted" value={deal.deleted ? 'Yes' : 'No'} />
          <Field label="Origin" value={deal.origin} />
          <Field label="Channel" value={deal.channel} />
          <Field label="Archive Time" value={deal.archive_time} type="date" />
        </dl>
      </CollapsibleSection>

      {/* Enhanced Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          {isAnyEditing ? (
            <>
              <button 
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-lg ${
                  hasChanges 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSaving ? 'Saving Changes...' : `Save All Changes${hasChanges ? ` (${Object.keys(formData).length})` : ''}`}
              </button>
              
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-lg"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel All Changes
              </button>
            </>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              onClick={onEdit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Deal
            </button>
          )}
          
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            onClick={onRefresh}
            disabled={isSaving}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <Link
            href={`https://app.pipedrive.com/deal/${deal.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View in Pipedrive
          </Link>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have unsaved changes that will be lost. Are you sure you want to continue?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 