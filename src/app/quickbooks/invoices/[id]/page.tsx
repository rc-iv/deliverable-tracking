import { notFound } from 'next/navigation';
import Link from 'next/link';

interface LinkedTransaction {
  TxnId: string;
  TxnType: string;
}

interface Payment {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  UnappliedAmt: number;
  PrivateNote?: string;
}

async function fetchPayment(id: string): Promise<Payment | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/quickbooks/payments?id=${id}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.payments?.[0] || null;
}

async function fetchInvoice(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/quickbooks/invoices?id=${id}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.invoices?.[0] || null;
}

function formatValue(value: any, key: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Format linked transactions
  if (key === 'LinkedTxn') {
    if (Array.isArray(value)) {
      return value.map(txn => {
        const type = txn.TxnType || 'Unknown';
        const id = txn.TxnId || 'Unknown';
        return `${type} #${id}`;
      }).join(', ');
    }
    return String(value);
  }

  // Format addresses
  if (key === 'BillAddr' || key === 'ShipAddr') {
    if (typeof value === 'object') {
      const parts = [];
      if (value.Line1) parts.push(value.Line1);
      if (value.Line2) parts.push(value.Line2);
      if (value.City) parts.push(value.City);
      if (value.CountrySubDivisionCode) parts.push(value.CountrySubDivisionCode);
      if (value.PostalCode) parts.push(value.PostalCode);
      return parts.join(', ');
    }
    return String(value);
  }

  // Format customer reference
  if (key === 'CustomerRef') {
    if (typeof value === 'object') {
      return `${value.name} (${value.value})`;
    }
    return String(value);
  }

  // Format dates
  if (key === 'TxnDate' || key === 'DueDate' || key === 'CreateTime' || key === 'LastUpdatedTime') {
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
  if (typeof value === 'number' && (key.includes('Amt') || key.includes('Price') || key.includes('Rate'))) {
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

  // Format tax details
  if (key === 'TxnTaxDetail') {
    if (typeof value === 'object') {
      const taxLines = value.TaxLine?.map((line: any) => {
        const percent = line.TaxLineDetail?.TaxPercent;
        const amount = line.Amount;
        return `${percent}% (${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount)})`;
      }).join(', ');
      return `Total Tax: ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value.TotalTax)}${taxLines ? ` (${taxLines})` : ''}`;
    }
    return String(value);
  }

  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
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

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await fetchInvoice(params.id);
  if (!invoice) return notFound();

  // Fetch details for all linked payments
  const paymentDetails = await Promise.all(
    (invoice.LinkedTxn || [])
      .filter((txn: LinkedTransaction) => txn.TxnType === 'Payment')
      .map((txn: LinkedTransaction) => fetchPayment(txn.TxnId))
  );

  // Calculate payment status based on balance and linked transactions
  const paymentStatus = invoice.Balance === 0 ? 'Paid' : 
                       invoice.LinkedTxn?.some((txn: LinkedTransaction) => txn.TxnType === 'Payment') ? 'Partially Paid' : 
                       'Unpaid';

  // Group fields into categories for better organization
  const categories = {
    'Basic Information': [
      'DocNumber',
      'TxnDate',
      'DueDate',
      'Balance',
      'TotalAmt',
      'CurrencyRef',
      'ExchangeRate',
      'PrivateNote'
    ],
    'Customer Information': [
      'CustomerRef',
      'BillAddr',
      'ShipAddr',
      'EmailStatus'
    ],
    'Payment Information': [
      'PaymentStatus',
      'Deposit',
      'AllowOnlineACHPayment',
      'AllowOnlineCreditCardPayment'
    ],
    'Tax Information': [
      'GlobalTaxCalculation',
      'TxnTaxDetail',
      'TaxExemptionRef'
    ],
    'System Information': [
      'Id',
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Invoice #{invoice.DocNumber}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {paymentStatus}
          </span>
        </div>

        {Object.entries(categories).map(([category, fields]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field} className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">{field}:</span>
                  <span className="mt-1 text-sm text-gray-900">
                    {field === 'PaymentStatus' ? paymentStatus : formatValue(invoice[field], field)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Linked Payments Section */}
        {invoice.LinkedTxn && invoice.LinkedTxn.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Linked Payments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unapplied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.LinkedTxn.map((txn: LinkedTransaction, index: number) => {
                    if (txn.TxnType !== 'Payment') return null;
                    const payment = paymentDetails[index];
                    
                    return (
                      <tr key={txn.TxnId}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {txn.TxnId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment ? new Date(payment.TxnDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment ? formatValue(payment.TotalAmt, 'Amount') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment ? formatValue(payment.UnappliedAmt, 'Amount') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment?.PrivateNote || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Link 
                            href={`/quickbooks/payments/${txn.TxnId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Payment
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Line Items Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.Line?.map((line: any, index: number) => {
                  if (line.DetailType === 'SubTotalLineDetail') {
                    return (
                      <tr key={index} className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">Subtotal</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatValue(line.Amount, 'Amount')}
                        </td>
                      </tr>
                    );
                  }
                  
                  const detail = line.SalesItemLineDetail;
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {detail?.ItemRef?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {line.Description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatValue(detail?.Qty, 'Qty')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatValue(detail?.UnitPrice, 'Rate')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatValue(line.Amount, 'Amount')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 