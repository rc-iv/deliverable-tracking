'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Deal } from '@/lib/pipedrive/types';
import { DealDetailView } from '@/components/deals/DealDetailView';
import { DealErrorBoundary, useDealErrorHandler } from '@/components/deals/ErrorBoundary';
import { ErrorDisplay, NetworkStatusIndicator } from '@/components/deals/ErrorDisplay';

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
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  const { handleError, getErrorMessage, isNetworkError } = useDealErrorHandler();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchDeal = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }
      
      console.log('🔍 Fetching deal details for ID:', dealId, isRetry ? `(Retry ${retryCount + 1})` : '');
      
      // Add timeout for network requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/pipedrive/deals/${dealId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data: DealResponse = await response.json();
      
      console.log('📦 API Response:', data);
      
      if (!data.success) {
        let errorMessage = data.message || 'Failed to fetch deal';
        
        // Enhanced error messages based on status codes
        if (response.status === 404) {
          errorMessage = `Deal with ID ${dealId} not found`;
        } else if (response.status === 410) {
          errorMessage = `Deal with ID ${dealId} has been deleted or archived`;
        } else if (response.status === 403) {
          errorMessage = `You don't have permission to view deal ${dealId}`;
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while fetching the deal';
        } else if (response.status >= 500) {
          errorMessage = 'Pipedrive service is temporarily unavailable';
        }
        
        setError(errorMessage);
        handleError(new Error(errorMessage), 'Deal Fetch');
        return;
      }
      
      if (!data.data) {
        const errorMessage = 'No deal data received from server';
        setError(errorMessage);
        handleError(new Error(errorMessage), 'Deal Data');
        return;
      }
      
      setDeal(data.data);
      setRetryCount(0); // Reset retry count on success
      console.log('✅ Deal loaded successfully:', data.data.title);
      
    } catch (err) {
      console.error('💥 Error fetching deal:', err);
      
      let errorMessage = 'An error occurred while fetching the deal';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out - the server took too long to respond';
        } else if (isNetworkError(err)) {
          errorMessage = 'Network connection failed - please check your internet connection';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      handleError(err instanceof Error ? err : new Error(errorMessage), 'Deal Fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Edit mode is now handled within the DealDetailView component
    console.log('🎯 Edit button clicked - edit mode is managed within DealDetailView');
  };

  const handleSave = async (updates: Record<string, any>) => {
    try {
      console.log('💾 Saving deal updates:', updates);
      
      const response = await fetch(`/api/pipedrive/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save deal updates');
      }
      
      console.log('✅ Deal saved successfully');
      
      // Refresh the deal data
      await fetchDeal();
      
    } catch (err) {
      console.error('💥 Error saving deal:', err);
      handleError(err instanceof Error ? err : new Error('Failed to save deal'), 'Deal Save');
      throw err; // Re-throw to let the component handle it
    }
  };

  const handleRetry = () => {
    fetchDeal(true);
  };

  const handleGoBack = () => {
    router.push('/deals');
  };

  useEffect(() => {
    if (dealId) {
      fetchDeal();
    }
  }, [dealId]);

  // Auto-retry on network reconnection
  useEffect(() => {
    if (isOnline && error && isNetworkError(error)) {
      console.log('🌐 Network reconnected, retrying...');
      setTimeout(() => fetchDeal(true), 1000);
    }
  }, [isOnline, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <NetworkStatusIndicator isOnline={isOnline} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Enhanced loading state with skeleton */}
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content skeleton */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading deal details...
              {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <NetworkStatusIndicator isOnline={isOnline} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onGoBack={handleGoBack}
            showTechnicalDetails={process.env.NODE_ENV === 'development'}
            context={`Deal ID: ${dealId}${retryCount > 0 ? `, Retry attempts: ${retryCount}` : ''}`}
          />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <NetworkStatusIndicator isOnline={isOnline} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deal Data Available</h3>
            <p className="text-gray-500 mb-4">The deal data could not be loaded or is empty.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/deals"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Back to Deals
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DealErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <NetworkStatusIndicator isOnline={isOnline} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Use the comprehensive DealDetailView component */}
          <DealDetailView 
            deal={deal}
            onRefresh={() => fetchDeal(true)}
            onEdit={handleEdit}
            onSave={handleSave}
          />
        </div>
      </div>
    </DealErrorBoundary>
  );
} 