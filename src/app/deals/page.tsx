'use client';

import { useState, useEffect } from 'react';
import { Deal } from '@/lib/pipedrive/types';
import { DealCard } from '@/components/deals/DealCard';

interface DealsResponse {
  success: boolean;
  message: string;
  data: Deal[];
  pagination?: {
    start: number;
    limit: number;
    more_items_in_collection: boolean;
    next_start?: number;
  };
  filter?: {
    status: string;
  };
}

type StatusFilter = 'open' | 'won' | 'lost' | 'all_not_deleted';

const statusOptions: { value: StatusFilter; label: string; description: string }[] = [
  { value: 'open', label: 'Open', description: 'Active deals in progress' },
  { value: 'won', label: 'Won', description: 'Successfully closed deals' },
  { value: 'lost', label: 'Lost', description: 'Deals that were not won' },
  { value: 'all_not_deleted', label: 'All Active', description: 'All non-deleted deals' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');

  const fetchDeals = async (status: StatusFilter = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching deals from API with status:', status);
      const response = await fetch(`/api/pipedrive/deals?status=${status}`);
      const data: DealsResponse = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch deals');
      }
      
      setDeals(data.data);
      console.log('✅ Deals loaded successfully:', data.data.length, 'deals with status:', status);
    } catch (err) {
      console.error('💥 Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleStatusChange = (newStatus: StatusFilter) => {
    console.log('🔄 Changing status filter from', statusFilter, 'to', newStatus);
    setStatusFilter(newStatus);
    fetchDeals(newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-2">Loading your Pipedrive deals...</p>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-2">Manage your Pipedrive deals</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading deals</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => fetchDeals()}
                  className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusOption = statusOptions.find(option => option.value === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-2">
            {deals.length} {deals.length === 1 ? 'deal' : 'deals'} from Pipedrive
            {currentStatusOption && ` • ${currentStatusOption.description}`}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                    statusFilter === option.value
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        {deals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {statusFilter} deals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No {statusFilter} deals were found in your Pipedrive account.
            </p>
            <button
              onClick={() => handleStatusChange('all_not_deleted')}
              className="mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all deals instead
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchDeals()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Deals'}
          </button>
        </div>
      </div>
    </div>
  );
} 