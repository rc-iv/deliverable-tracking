'use client';

import { useState } from 'react';
import InvoiceEditForm from './InvoiceEditForm';

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

interface Invoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  Line: InvoiceLine[];
  [key: string]: any;
}

interface InvoiceDetailWrapperProps {
  invoice: Invoice;
  children: React.ReactNode;
}

export default function InvoiceDetailWrapper({ invoice, children }: InvoiceDetailWrapperProps) {
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUpdate = async (updates: { TxnDate?: string; Line?: InvoiceLine[] }) => {
    try {
      const response = await fetch('/api/quickbooks/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: invoice.Id,
          updates
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      const result = await response.json();
      
      // Update the local state with the new invoice data
      if (result.invoice) {
        setCurrentInvoice(result.invoice);
      }

      // Refresh the page data
      setIsRefreshing(true);
      window.location.reload();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div>
      <InvoiceEditForm 
        invoice={currentInvoice} 
        onUpdate={handleUpdate} 
      />
      {children}
    </div>
  );
} 