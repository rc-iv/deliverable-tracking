import { Deal } from '@/lib/pipedrive/types';
import { getNonEmptyCustomFields } from '@/lib/pipedrive/fieldMapping';

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  // Format the deal value
  const formatValue = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  // Get custom fields that have values
  const customFields = getNonEmptyCustomFields(deal);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {deal.title}
          </h3>
          <p className="text-sm text-gray-500">ID: {deal.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deal.status)}`}>
          {deal.status.toUpperCase()}
        </span>
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(deal.value, deal.currency)}
        </div>
        <div className="text-sm text-gray-500">
          {deal.formatted_value && deal.formatted_value !== formatValue(deal.value, deal.currency) 
            ? `(${deal.formatted_value})` 
            : ''
          }
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {deal.person_name && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-16">Contact:</span>
            <span className="text-gray-900 font-medium">{deal.person_name}</span>
          </div>
        )}
        
        {deal.org_name && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-16">Company:</span>
            <span className="text-gray-900 font-medium">{deal.org_name}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Owner:</span>
          <span className="text-gray-900 font-medium">{deal.owner_name}</span>
        </div>
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Fields</h4>
          <div className="space-y-1">
            {customFields.slice(0, 3).map((field) => (
              <div key={field.key} className="flex items-center text-sm">
                <span className="text-gray-500 w-20 text-xs truncate" title={field.name}>
                  {field.name}:
                </span>
                <span className="text-gray-900 font-medium text-xs ml-1 flex-1 truncate" title={field.formattedValue}>
                  {field.formattedValue}
                </span>
              </div>
            ))}
            {customFields.length > 3 && (
              <div className="text-xs text-gray-400 italic">
                +{customFields.length - 3} more fields
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div>
          Created: {formatDate(deal.add_time)}
        </div>
        <div>
          Updated: {formatDate(deal.update_time)}
        </div>
      </div>
    </div>
  );
} 