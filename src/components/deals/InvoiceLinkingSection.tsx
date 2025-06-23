'use client';

import { useState, useEffect } from 'react';
import { getDealInvoiceLinking, formatInvoiceStatus } from '@/lib/pipedrive/invoiceLinking';
import { InvoiceCreationForm } from './InvoiceCreationForm';

interface InvoiceLinkingSectionProps {
  deal: any;
  onRefresh?: () => void;
}

export function InvoiceLinkingSection({ deal, onRefresh }: InvoiceLinkingSectionProps) {
  const [linkingData, setLinkingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchLinkingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDealInvoiceLinking(deal);
      setLinkingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkingData();
  }, [deal]);

  const handleInvoiceCreated = async (invoiceData: any) => {
    // Refresh the linking data to show the new invoice
    await fetchLinkingData();
    setShowCreateForm(false);
    
    // Call parent refresh if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">Invoice Information</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900">Invoice Information</h2>
        </div>
        <div className="text-red-600 text-sm">
          Error loading invoice data: {error}
        </div>
      </div>
    );
  }

  const { linkingInfo, linkedInvoice } = linkingData;

  // Show invoice creation form if requested
  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Invoice from Deal</h2>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <InvoiceCreationForm 
          deal={deal} 
          onInvoiceCreated={handleInvoiceCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900">Invoice Information</h2>
      </div>

      <dl className="divide-y divide-gray-100">
        {/* Invoice Number */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
          <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Invoice Number</dt>
          <dd className="text-sm text-gray-900 sm:w-2/3">
            {linkingInfo.hasInvoiceNumber ? (
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {linkingInfo.invoiceNumber}
              </span>
            ) : (
              <span className="text-gray-400 italic">No invoice number set</span>
            )}
          </dd>
        </div>

        {/* Invoice Status */}
        {linkedInvoice && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
              <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Invoice Status</dt>
              <dd className="text-sm sm:w-2/3">
                {(() => {
                  const status = formatInvoiceStatus(linkedInvoice);
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                      {status.status}
                    </span>
                  );
                })()}
              </dd>
            </div>

            {/* Invoice Amount */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
              <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Invoice Amount</dt>
              <dd className="text-sm text-gray-900 sm:w-2/3">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(linkedInvoice.TotalAmt || 0)}
              </dd>
            </div>

            {/* Balance */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
              <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Balance Due</dt>
              <dd className="text-sm text-gray-900 sm:w-2/3">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(linkedInvoice.Balance || 0)}
              </dd>
            </div>

            {/* Due Date */}
            {linkedInvoice.DueDate && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Due Date</dt>
                <dd className="text-sm text-gray-900 sm:w-2/3">
                  {new Date(linkedInvoice.DueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            )}

            {/* Customer */}
            {linkedInvoice.CustomerRef && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                <dt className="text-sm font-medium text-gray-500 sm:w-1/3">QuickBooks Customer</dt>
                <dd className="text-sm text-gray-900 sm:w-2/3">
                  {linkedInvoice.CustomerRef.name || linkedInvoice.CustomerRef.value}
                </dd>
              </div>
            )}

            {/* QuickBooks Link */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
              <dt className="text-sm font-medium text-gray-500 sm:w-1/3">QuickBooks Link</dt>
              <dd className="text-sm sm:w-2/3">
                <a 
                  href={`/quickbooks/invoices/${linkedInvoice.Id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Invoice Details →
                </a>
              </dd>
            </div>
          </>
        )}

        {/* No Invoice Found */}
        {linkingInfo.hasInvoiceNumber && !linkedInvoice && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
            <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Invoice Status</dt>
            <dd className="text-sm text-gray-900 sm:w-2/3">
              <span className="text-orange-600 font-medium">
                Invoice not found in QuickBooks
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Invoice number {linkingInfo.invoiceNumber} was not found in your QuickBooks account.
              </p>
            </dd>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
          <dt className="text-sm font-medium text-gray-500 sm:w-1/3">Actions</dt>
          <dd className="text-sm sm:w-2/3">
            <div className="flex gap-2">
              {!linkingInfo.hasInvoiceNumber ? (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Invoice from Deal
                </button>
              ) : (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Create New Invoice
                </button>
              )}
              <button 
                onClick={fetchLinkingData}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );
} 