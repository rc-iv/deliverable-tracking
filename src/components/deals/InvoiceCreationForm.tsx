'use client';

import { useState } from 'react';
import { Deal } from '@/lib/pipedrive/types';
import { CustomerSearchDropdown } from './CustomerSearchDropdown';

interface InvoiceCreationFormProps {
  deal: Deal;
  onInvoiceCreated?: (invoiceData: any) => void;
  onCancel?: () => void;
}

interface LineItem {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

export function InvoiceCreationForm({ deal, onInvoiceCreated, onCancel }: InvoiceCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState(deal.org_name || deal.person_name || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  });
  const [memo, setMemo] = useState(`Invoice for ${deal.title}`);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      description: deal.title || 'Services',
      amount: deal.value || 0,
      quantity: 1,
      unitPrice: deal.value || 0
    }
  ]);

  const handleCustomerChange = (id: string, name: string) => {
    setCustomerId(id);
    setCustomerName(name);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      description: '',
      amount: 0,
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Recalculate amount if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      const item = newLineItems[index];
      newLineItems[index] = {
        ...item,
        amount: item.quantity * item.unitPrice
      };
    }
    
    setLineItems(newLineItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create the invoice in QuickBooks
      const createResponse = await fetch('/api/quickbooks/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: deal.id,
          customerId: customerId || undefined, // Use customer ID if available
          customerName,
          customerEmail: customerEmail || undefined,
          invoiceNumber: invoiceNumber || undefined, // Include invoice number if provided
          lineItems: lineItems.map(item => ({
            description: item.description,
            amount: item.amount,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          dueDate,
          memo
        })
      });

      const createResult = await createResponse.json();

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create invoice');
      }

      // Update Pipedrive deal with invoice number
      const updateResponse = await fetch('/api/pipedrive/deals/update-invoice-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: deal.id,
          invoiceNumber: createResult.invoiceNumber
        })
      });

      const updateResult = await updateResponse.json();

      if (!updateResult.success) {
        console.warn('Failed to update Pipedrive deal with invoice number:', updateResult.error);
        // Don't throw error here as the invoice was created successfully
      }

      setSuccess(`Invoice #${createResult.invoiceNumber} created successfully!`);
      
      if (onInvoiceCreated) {
        onInvoiceCreated(createResult);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900">Create Invoice from Deal</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QuickBooks Customer *
            </label>
            <CustomerSearchDropdown
              value={customerName}
              onChange={handleCustomerChange}
              placeholder="Search or create customer..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Search existing customers or create a new one
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="customer@example.com"
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number (Optional)
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave blank for auto-numbering"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to auto-generate the next invoice number
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memo
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Invoice memo"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Price"
                  />
                </div>
                <div className="col-span-2">
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-right font-medium">
                    ${item.amount.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="w-full p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || calculateTotal() === 0 || !customerName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Invoice...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 