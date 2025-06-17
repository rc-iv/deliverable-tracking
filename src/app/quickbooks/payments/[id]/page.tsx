import { notFound } from 'next/navigation';
import Link from 'next/link';

async function fetchPayment(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/quickbooks/payments?id=${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.payments[0];
}

function formatValue(value: any, key: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Format customer reference
  if (key === 'CustomerRef') {
    if (typeof value === 'object') {
      return `${value.name} (${value.value})`;
    }
    return String(value);
  }

  // Format account reference
  if (key === 'DepositToAccountRef') {
    if (typeof value === 'object') {
      return value.name ? `${value.name} (${value.value})` : `Account ${value.value}`;
    }
    return String(value);
  }

  // Format dates
  if (key === 'TxnDate' || key === 'CreateTime' || key === 'LastUpdatedTime') {
    if (typeof value === 'string') {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Format currency amounts
  if (typeof value === 'number' && (key.includes('Amt') || key.includes('Amount'))) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  // Format currency reference
  if (key === 'CurrencyRef') {
    if (typeof value === 'object') {
      return `${value.name} (${value.value})`;
    }
    return String(value);
  }

  // Format metadata
  if (key === 'MetaData') {
    if (typeof value === 'object') {
      const created = value.CreateTime ? new Date(value.CreateTime).toLocaleString() : 'N/A';
      const updated = value.LastUpdatedTime ? new Date(value.LastUpdatedTime).toLocaleString() : 'N/A';
      return `Created: ${created}, Last Updated: ${updated}`;
    }
    return String(value);
  }

  // Format line items
  if (key === 'Line') {
    if (Array.isArray(value)) {
      return value.map(line => {
        const amount = line.Amount ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(line.Amount) : 'N/A';
        
        const linkedTxn = line.LinkedTxn?.[0];
        const txnType = linkedTxn?.TxnType || 'N/A';
        const txnId = linkedTxn?.TxnId || 'N/A';
        
        return `${txnType} #${txnId}: ${amount}`;
      }).join(', ');
    }
    return String(value);
  }

  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Format arrays
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object') {
        return Object.entries(item)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
      return String(item);
    }).join(', ');
  }

  // Format objects
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  return String(value);
}

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await fetchPayment(params.id);
  if (!payment) return notFound();

  // Group fields into categories for better organization
  const categories = {
    'Basic Information': [
      'Id',
      'TxnDate',
      'TotalAmt',
      'UnappliedAmt',
      'CurrencyRef'
    ],
    'Customer Information': [
      'CustomerRef'
    ],
    'Account Information': [
      'DepositToAccountRef'
    ],
    'Payment Details': [
      'ProcessPayment',
      'Line'
    ],
    'System Information': [
      'SyncToken',
      'MetaData',
      'domain',
      'sparse'
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/quickbooks" className="text-blue-600 hover:text-blue-800">
          ← Back to QuickBooks
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Payment #{payment.Id}
        </h1>

        {Object.entries(categories).map(([category, fields]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field} className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">{field}:</span>
                  <span className="mt-1 text-sm text-gray-900">
                    {formatValue(payment[field], field)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 