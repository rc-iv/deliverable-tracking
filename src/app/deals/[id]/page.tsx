'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Deal } from '@/lib/pipedrive/types';

interface DealResponse {
  success: boolean;
  message: string;
  data?: Deal & {
    formatted_custom_fields?: Array<{
      key: string;
      name: string;
      value: any;
      formattedValue: string;
      fieldType: string;
    }>;
  };
  metadata?: {
    fetched_at: string;
    custom_fields_count: number;
    total_fields_count: number;
  };
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching deal details for ID:', dealId);
      const response = await fetch(`/api/pipedrive/deals/${dealId}`);
      const data: DealResponse = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (!data.success) {
        if (response.status === 404) {
          setError(`Deal with ID ${dealId} not found`);
        } else if (response.status === 410) {
          setError(`Deal with ID ${dealId} has been deleted or archived`);
        } else {
          setError(data.message || 'Failed to fetch deal');
        }
        return;
      }
      
      if (!data.data) {
        setError('No deal data received');
        return;
      }
      
      setDeal(data.data);
      console.log('✅ Deal loaded successfully:', data.data.title);
    } catch (err) {
      console.error('💥 Error fetching deal:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching the deal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) {
      fetchDeal();
    }
  }, [dealId]);

  // Format currency
  const formatValue = (value: number, currency: string) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <Link 
              href="/deals" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Deals
            </Link>
          </div>

          {/* Loading header */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading deal details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <Link 
              href="/deals" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Deals
            </Link>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading deal</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => fetchDeal()}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/deals"
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Go Back to Deals
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">No deal data available</p>
            <Link
              href="/deals"
              className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
            >
              Back to Deals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/deals" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deals
          </Link>
        </div>

        {/* Deal Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {deal.title}
              </h1>
              <p className="text-gray-500">Deal ID: {deal.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(deal.status)}`}>
              {deal.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Deal Value</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(deal.value, deal.currency)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
              <p className="text-lg text-gray-900">{deal.owner_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
              <p className="text-lg text-gray-900">{formatDate(deal.update_time)}</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h3>
              <p className="text-gray-900">{deal.person_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Organization</h3>
              <p className="text-gray-900">{deal.org_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pipeline</h3>
              <p className="text-gray-900">Pipeline ID: {deal.pipeline_id || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Stage</h3>
              <p className="text-gray-900">Stage ID: {deal.stage_id || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created Date</h3>
              <p className="text-gray-900">{formatDate(deal.add_time)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Expected Close Date</h3>
              <p className="text-gray-900">{deal.expected_close_date ? formatDate(deal.expected_close_date) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Custom Fields (if available) */}
        {deal.formatted_custom_fields && deal.formatted_custom_fields.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Fields</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deal.formatted_custom_fields.map((field) => (
                <div key={field.key}>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{field.name}</h3>
                  <p className="text-gray-900">{field.formattedValue || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">Type: {field.fieldType}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          
          <div className="flex gap-4">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              onClick={() => alert('Edit functionality coming soon!')}
            >
              Edit Deal
            </button>
            
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              onClick={() => fetchDeal()}
            >
              Refresh
            </button>
            
            <Link
              href={`https://app.pipedrive.com/deal/${deal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View in Pipedrive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 