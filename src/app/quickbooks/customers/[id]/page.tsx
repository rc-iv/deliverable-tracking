import { notFound } from 'next/navigation';

async function fetchCustomer(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/quickbooks/customers?id=${id}`);
  const data = await res.json();
  if (!data.success || !data.customers || !data.customers.length) return null;
  return data.customers[0];
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    // Format address objects
    if (value.Line1) {
      return `${value.Line1}${value.Line2 ? `, ${value.Line2}` : ''}, ${value.City}, ${value.CountrySubDivisionCode} ${value.PostalCode}`;
    }
    // Format phone objects
    if (value.FreeFormNumber) {
      return value.FreeFormNumber;
    }
    // Format email objects
    if (value.Address) {
      return value.Address;
    }
    // Format currency objects
    if (value.value && value.name) {
      return `${value.name} (${value.value})`;
    }
    // Format metadata objects
    if (value.CreateTime) {
      return `Created: ${new Date(value.CreateTime).toLocaleString()}, Last Updated: ${new Date(value.LastUpdatedTime).toLocaleString()}`;
    }
    // For other objects, show key-value pairs
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(value);
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await fetchCustomer(params.id);
  if (!customer) return notFound();

  // Group fields into categories for better organization
  const categories = {
    'Basic Information': [
      'DisplayName',
      'CompanyName',
      'GivenName',
      'FamilyName',
      'FullyQualifiedName',
      'PrintOnCheckName',
      'Active',
      'Taxable',
      'Job',
      'BillWithParent',
      'IsProject',
    ],
    'Contact Information': [
      'PrimaryPhone',
      'PrimaryEmailAddr',
      'PreferredDeliveryMethod',
    ],
    'Addresses': [
      'BillAddr',
      'ShipAddr',
    ],
    'Financial Information': [
      'Balance',
      'BalanceWithJobs',
      'CurrencyRef',
    ],
    'System Information': [
      'Id',
      'SyncToken',
      'MetaData',
      'domain',
      'sparse',
      'V4IDPseudonym',
      'ClientEntityId',
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-4xl mx-auto">
      <a href="/quickbooks" className="text-blue-600 hover:underline mb-4 block">← Back to QuickBooks</a>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Customer: {customer.DisplayName}</h1>
        
        {Object.entries(categories).map(([category, fields]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{category}</h2>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field} className="flex text-sm">
                  <span className="w-48 text-gray-500 font-medium">{field}:</span>
                  <span className="text-gray-900 flex-1">{formatValue(customer[field])}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 