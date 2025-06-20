/**
 * Invoice Linking Utilities
 * Handles the connection between Pipedrive deals and QuickBooks invoices
 */

import { getFieldDefinition } from './fieldMapping';

// QuickBooks Invoice Number custom field key in Pipedrive
export const QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY = '1145157c2e32c3664dcb49085fcb7c32dbcde920';

/**
 * Extract invoice number from a Pipedrive deal
 */
export function extractInvoiceNumberFromDeal(deal: any): string | null {
  if (!deal || typeof deal !== 'object') {
    return null;
  }

  const invoiceNumber = deal[QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY];
  
  if (invoiceNumber === null || invoiceNumber === undefined || invoiceNumber === '') {
    return null;
  }

  // Convert to string and clean up
  return String(invoiceNumber).trim();
}

/**
 * Check if a deal has an invoice number
 */
export function hasInvoiceNumber(deal: any): boolean {
  return extractInvoiceNumberFromDeal(deal) !== null;
}

/**
 * Get invoice linking information for a deal
 */
export function getInvoiceLinkingInfo(deal: any): {
  hasInvoiceNumber: boolean;
  invoiceNumber: string | null;
  fieldKey: string;
  fieldName: string;
} {
  const invoiceNumber = extractInvoiceNumberFromDeal(deal);
  const fieldDefinition = getFieldDefinition(QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY);
  
  return {
    hasInvoiceNumber: invoiceNumber !== null,
    invoiceNumber,
    fieldKey: QUICKBOOKS_INVOICE_NUMBER_FIELD_KEY,
    fieldName: fieldDefinition?.name || 'QuickBooks Invoice Number'
  };
}

/**
 * Search for linked QuickBooks invoice
 */
export async function searchLinkedInvoice(invoiceNumber: string): Promise<any> {
  try {
    const response = await fetch(`/api/quickbooks/invoices/search?invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to search for invoice');
    }
    
    return data;
  } catch (error) {
    console.error('Error searching for linked invoice:', error);
    throw error;
  }
}

/**
 * Get comprehensive deal-invoice linking data
 */
export async function getDealInvoiceLinking(deal: any): Promise<{
  deal: any;
  linkingInfo: {
    hasInvoiceNumber: boolean;
    invoiceNumber: string | null;
    fieldKey: string;
    fieldName: string;
  };
  linkedInvoice: any | null;
  error: string | null;
}> {
  const linkingInfo = getInvoiceLinkingInfo(deal);
  let linkedInvoice = null;
  let error = null;

  if (linkingInfo.hasInvoiceNumber && linkingInfo.invoiceNumber) {
    try {
      const searchResult = await searchLinkedInvoice(linkingInfo.invoiceNumber);
      linkedInvoice = searchResult.invoices.length > 0 ? searchResult.invoices[0] : null;
    } catch (searchError) {
      error = searchError instanceof Error ? searchError.message : 'Unknown error occurred';
    }
  }

  return {
    deal,
    linkingInfo,
    linkedInvoice,
    error
  };
}

/**
 * Format invoice status for display
 */
export function formatInvoiceStatus(invoice: any): {
  status: string;
  color: string;
  description: string;
} {
  if (!invoice) {
    return {
      status: 'Unknown',
      color: 'gray',
      description: 'Invoice not found'
    };
  }

  const balance = invoice.Balance || 0;
  const totalAmt = invoice.TotalAmt || 0;
  const dueDate = invoice.DueDate ? new Date(invoice.DueDate) : null;
  const today = new Date();

  // Check if invoice is paid
  if (balance === 0 && totalAmt > 0) {
    return {
      status: 'Paid',
      color: 'green',
      description: 'Invoice has been fully paid'
    };
  }

  // Check if invoice is overdue
  if (dueDate && dueDate < today && balance > 0) {
    return {
      status: 'Overdue',
      color: 'red',
      description: `Invoice is overdue by ${Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days`
    };
  }

  // Check if invoice is partially paid
  if (balance > 0 && balance < totalAmt) {
    return {
      status: 'Partial',
      color: 'yellow',
      description: `Partially paid - $${(totalAmt - balance).toFixed(2)} paid of $${totalAmt.toFixed(2)}`
    };
  }

  // Default to pending
  return {
    status: 'Pending',
    color: 'blue',
    description: 'Invoice is pending payment'
  };
} 