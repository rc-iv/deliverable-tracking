'use client';

import { useState, useEffect, useRef } from 'react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  displayName?: string;
  active: boolean;
  balance?: number;
  totalRevenue?: number;
}

interface CustomerSearchDropdownProps {
  value: string;
  onChange: (customerId: string, customerName: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomerSearchDropdown({ 
  value, 
  onChange, 
  placeholder = "Search customers...", 
  className = "",
  disabled = false 
}: CustomerSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalCount: 0,
    hasMore: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers when query changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/quickbooks/customers/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            page: 1,
            limit: 50 // Increased limit for better initial load
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to search customers');
        }

        setCustomers(result.customers);
        setPagination({
          page: result.pagination.page,
          totalCount: result.pagination.totalCount,
          hasMore: result.pagination.hasMore
        });
        setShowCreateNew(searchQuery.trim().length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search customers');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  // Load initial customers when dropdown opens
  useEffect(() => {
    if (isOpen && customers.length === 0 && !searchQuery) {
      setSearchQuery('');
    }
  }, [isOpen, customers.length, searchQuery]);

  const loadMoreCustomers = async () => {
    if (!pagination.hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const nextPage = pagination.page + 1;
      const response = await fetch('/api/quickbooks/customers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          page: nextPage,
          limit: 50
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load more customers');
      }

      setCustomers(prev => [...prev, ...result.customers]);
      setPagination({
        page: result.pagination.page,
        totalCount: result.pagination.totalCount,
        hasMore: result.pagination.hasMore
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    onChange(customer.id, customer.name);
    setIsOpen(false);
    setShowCreateNew(false);
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/quickbooks/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomerName,
          email: newCustomerEmail || undefined
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create customer');
      }

      // Select the newly created customer
      const newCustomer: Customer = {
        id: result.customer.Id,
        name: result.customer.DisplayName || result.customer.Name,
        email: result.customer.PrimaryEmailAddr?.Address,
        active: result.customer.Active,
        displayName: result.customer.DisplayName
      };
      
      handleSelectCustomer(newCustomer);
      setNewCustomerName('');
      setNewCustomerEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsOpen(true);
    
    // Clear selection if user is typing
    if (selectedCustomer && newValue !== selectedCustomer.name) {
      setSelectedCustomer(null);
      onChange('', '');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCreateNew && newCustomerName.trim()) {
      e.preventDefault();
      handleCreateNewCustomer();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading && customers.length === 0 && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2">Searching customers...</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 text-red-600 text-sm">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && customers.length === 0 && searchQuery && (
            <div className="p-3 text-gray-500 text-sm">
              No customers found matching "{searchQuery}"
            </div>
          )}
          
          {!loading && !error && customers.length > 0 && (
            <div className="py-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  {customer.email && (
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  )}
                  {customer.companyName && customer.companyName !== customer.name && (
                    <div className="text-sm text-gray-500">{customer.companyName}</div>
                  )}
                </button>
              ))}
              
              {/* Load More Button */}
              {pagination.hasMore && (
                <button
                  onClick={loadMoreCustomers}
                  disabled={loading}
                  className="w-full px-3 py-2 text-center text-blue-600 hover:bg-blue-50 focus:outline-none disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : (
                    `Load more customers (${customers.length} of ${pagination.totalCount})`
                  )}
                </button>
              )}
            </div>
          )}
          
          {showCreateNew && !loading && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Create new customer
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleCreateNewCustomer}
                  disabled={!newCustomerName.trim() || loading}
                  className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 