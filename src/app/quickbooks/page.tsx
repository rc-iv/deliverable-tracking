'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Customer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  CompanyName?: string;
  Active?: boolean;
}

interface Invoice {
  Id: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CustomerRef?: { value: string; name?: string };
  Status?: string;
}

interface Payment {
  Id: string;
  TotalAmt?: number;
  TxnDate?: string;
  CustomerRef?: { value: string; name?: string };
  PaymentRefNum?: string;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {children}
    </div>
  );
}

export default function QuickBooksDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      setLoading(true);
      setError(null);
      try {
        // First, check if we have a valid token by trying to fetch customers
        const response = await fetch('/api/quickbooks/customers');
        const data = await response.json();
        
        if (data.success) {
          setIsConnected(true);
          // If connected, fetch all data
          await fetchAll();
        } else {
          setIsConnected(false);
          setError('Not connected to QuickBooks');
        }
      } catch (err: any) {
        setIsConnected(false);
        setError('Not connected to QuickBooks');
      } finally {
        setLoading(false);
      }
    }

    async function fetchAll() {
      try {
        const [custRes, invRes, payRes] = await Promise.all([
          fetch('/api/quickbooks/customers'),
          fetch('/api/quickbooks/invoices'),
          fetch('/api/quickbooks/payments'),
        ]);
        const custData = await custRes.json();
        const invData = await invRes.json();
        const payData = await payRes.json();
        if (!custData.success || !invData.success || !payData.success) {
          throw new Error('Failed to fetch QuickBooks data');
        }
        setCustomers(custData.customers);
        setInvoices(invData.invoices);
        setPayments(payData.payments);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    }

    checkConnection();
  }, []);

  const handleConnect = () => {
    // Redirect to the OAuth flow
    window.location.href = '/api/quickbooks/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">QuickBooks Dashboard</h1>
        
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading QuickBooks data...</div>
        ) : !isConnected ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-gray-600 mb-6">
                <p className="text-lg mb-2">Not connected to QuickBooks</p>
                <p className="text-sm">Connect your QuickBooks account to view customers, invoices, and payments.</p>
              </div>
              <button
                onClick={handleConnect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Connect to QuickBooks
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : (
          <>
            {/* Customers */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Customers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.length === 0 ? (
                  <div className="col-span-full text-gray-400">No customers found.</div>
                ) : customers.map((c) => (
                  <Link key={c.Id} href={`/quickbooks/customers/${c.Id}`} className="block hover:no-underline">
                    <Card>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{c.DisplayName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${c.Active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{c.Active ? 'Active' : 'Inactive'}</span>
                      </div>
                      {c.CompanyName && <div className="text-sm text-gray-500 mb-1">Company: {c.CompanyName}</div>}
                      {c.PrimaryEmailAddr && <div className="text-sm text-gray-500 mb-1">Email: {c.PrimaryEmailAddr.Address}</div>}
                      {c.PrimaryPhone && <div className="text-sm text-gray-500 mb-1">Phone: {c.PrimaryPhone.FreeFormNumber}</div>}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Invoices */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">Invoices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.length === 0 ? (
                  <div className="col-span-full text-gray-400">No invoices found.</div>
                ) : invoices.map((inv) => (
                  <Link key={inv.Id} href={`/quickbooks/invoices/${inv.Id}`} className="block hover:no-underline">
                    <Card>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">Invoice #{inv.DocNumber || inv.Id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${inv.Status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>{inv.Status || 'Open'}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">Customer: {inv.CustomerRef?.name || inv.CustomerRef?.value}</div>
                      <div className="text-sm text-gray-500 mb-1">Date: {inv.TxnDate || '-'}</div>
                      <div className="text-sm text-gray-500 mb-1">Due: {inv.DueDate || '-'}</div>
                      <div className="text-sm text-gray-500 mb-1">Total: <span className="font-semibold text-gray-900">{typeof inv.TotalAmt === 'number' ? `$${inv.TotalAmt.toFixed(2)}` : '-'}</span></div>
                      <div className="text-sm text-gray-500 mb-1">Balance: <span className="font-semibold text-gray-900">{typeof inv.Balance === 'number' ? `$${inv.Balance.toFixed(2)}` : '-'}</span></div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Payments */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Payments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.length === 0 ? (
                  <div className="col-span-full text-gray-400">No payments found.</div>
                ) : payments.map((p) => (
                  <Link key={p.Id} href={`/quickbooks/payments/${p.Id}`} className="block hover:no-underline">
                    <Card>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">Payment #{p.PaymentRefNum || p.Id}</h3>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">Customer: {p.CustomerRef?.name || p.CustomerRef?.value}</div>
                      <div className="text-sm text-gray-500 mb-1">Date: {p.TxnDate || '-'}</div>
                      <div className="text-sm text-gray-500 mb-1">Amount: <span className="font-semibold text-gray-900">{typeof p.TotalAmt === 'number' ? `$${p.TotalAmt.toFixed(2)}` : '-'}</span></div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
} 