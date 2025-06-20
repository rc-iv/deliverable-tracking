'use client';

import { useState } from 'react';

interface InvoiceLine {
  Id?: string;
  LineNum?: number;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef: {
      value: string;
      name?: string;
    };
    UnitPrice?: number;
    Qty?: number;
    TaxCodeRef?: {
      value: string;
    };
  };
  Description?: string;
}

interface InvoiceEditFormProps {
  invoice: {
    Id: string;
    DocNumber: string;
    TxnDate: string;
    Line: InvoiceLine[];
  };
  onUpdate: (updates: { TxnDate?: string; Line?: InvoiceLine[] }) => Promise<void>;
}

export default function InvoiceEditForm({ invoice, onUpdate }: InvoiceEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [txnDate, setTxnDate] = useState(invoice.TxnDate);
  const [lineItems, setLineItems] = useState<InvoiceLine[]>(invoice.Line);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTxnDate(invoice.TxnDate);
    setLineItems(invoice.Line);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { TxnDate?: string; Line?: InvoiceLine[] } = {};
      
      if (txnDate !== invoice.TxnDate) {
        updates.TxnDate = txnDate;
      }
      
      if (JSON.stringify(lineItems) !== JSON.stringify(invoice.Line)) {
        updates.Line = lineItems;
      }

      if (Object.keys(updates).length === 0) {
        setError('No changes detected');
        setIsLoading(false);
        return;
      }

      await onUpdate(updates);
      setSuccess('Invoice updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...lineItems];
    const lineItem = { ...newLineItems[index] };
    
    if (field === 'Description') {
      lineItem.Description = value;
    } else if (field === 'Qty' || field === 'UnitPrice') {
      if (!lineItem.SalesItemLineDetail) {
        lineItem.SalesItemLineDetail = {
          ItemRef: { value: '', name: '' },
          UnitPrice: 0,
          Qty: 1
        };
      }
      
      if (field === 'Qty') {
        lineItem.SalesItemLineDetail.Qty = parseFloat(value) || 0;
      } else if (field === 'UnitPrice') {
        lineItem.SalesItemLineDetail.UnitPrice = parseFloat(value) || 0;
      }
      
      // Recalculate amount
      if (lineItem.SalesItemLineDetail.Qty && lineItem.SalesItemLineDetail.UnitPrice) {
        lineItem.Amount = lineItem.SalesItemLineDetail.Qty * lineItem.SalesItemLineDetail.UnitPrice;
      }
    }
    
    newLineItems[index] = lineItem;
    setLineItems(newLineItems);
  };

  const removeLineItem = (index: number) => {
    const newLineItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newLineItems);
  };

  const addLineItem = () => {
    const newLineItem: InvoiceLine = {
      Amount: 0,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: { value: '', name: 'New Item' },
        UnitPrice: 0,
        Qty: 1
      },
      Description: 'New line item'
    };
    setLineItems([...lineItems, newLineItem]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Edit Invoice</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit Invoice
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Transaction Date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Date
        </label>
        <input
          type="date"
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-md text-base ${
            isEditing 
              ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white' 
              : 'border-gray-200 bg-gray-50 text-gray-600'
          }`}
        />
      </div>

      {/* Line Items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Line Items
          </label>
          {isEditing && (
            <button
              onClick={addLineItem}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Add Item
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                {isEditing && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.map((line, index) => {
                if (line.DetailType === 'SubTotalLineDetail') {
                  return (
                    <tr key={index} className="bg-gray-50">
                      <td colSpan={isEditing ? 4 : 3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Subtotal
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${line.Amount.toFixed(2)}
                      </td>
                      {isEditing && <td></td>}
                    </tr>
                  );
                }

                const detail = line.SalesItemLineDetail;
                return (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={line.Description || ''}
                          onChange={(e) => updateLineItem(index, 'Description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter description"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{line.Description || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={detail?.Qty || 0}
                          onChange={(e) => updateLineItem(index, 'Qty', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{detail?.Qty || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={detail?.UnitPrice || 0}
                          onChange={(e) => updateLineItem(index, 'UnitPrice', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          ${detail?.UnitPrice?.toFixed(2) || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        ${line.Amount.toFixed(2)}
                      </span>
                    </td>
                    {isEditing && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
} 