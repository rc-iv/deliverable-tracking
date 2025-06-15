'use client';

import Link from 'next/link';
import { useDealErrorHandler } from './ErrorBoundary';

export interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  type?: 'network' | 'not-found' | 'permission' | 'validation' | 'server' | 'generic';
  onRetry?: () => void;
  onGoBack?: () => void;
  showTechnicalDetails?: boolean;
  context?: string;
}

export function ErrorDisplay({
  error,
  title,
  type = 'generic',
  onRetry,
  onGoBack,
  showTechnicalDetails = false,
  context
}: ErrorDisplayProps) {
  const { getErrorMessage, isNetworkError } = useDealErrorHandler();
  
  const errorMessage = getErrorMessage(error);
  const isNetwork = isNetworkError(error);
  
  // Auto-detect error type if not specified
  const detectedType = type === 'generic' ? detectErrorType(errorMessage) : type;
  
  const errorConfig = getErrorConfig(detectedType);
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {errorConfig.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {title || errorConfig.title}
          </h3>
          
          <div className="text-sm text-red-700 mb-4">
            <p className="mb-2">{errorMessage}</p>
            
            {errorConfig.suggestions.length > 0 && (
              <div>
                <p className="mb-2 font-medium">Possible solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {errorConfig.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {showTechnicalDetails && error instanceof Error && (
            <details className="mb-4">
              <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Type:</strong> {error.name}
                </div>
                {context && (
                  <div className="mb-2">
                    <strong>Context:</strong> {context}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}
            
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go Back
              </button>
            )}
            
            <Link
              href="/deals"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              All Deals
            </Link>

            {isNetwork && (
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Page
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact error display for inline use
export function InlineErrorDisplay({ 
  error, 
  onRetry, 
  className = "" 
}: { 
  error: string | Error; 
  onRetry?: () => void; 
  className?: string; 
}) {
  const { getErrorMessage } = useDealErrorHandler();
  
  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-center">
        <svg className="h-4 w-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-red-700">{getErrorMessage(error)}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Network status indicator
export function NetworkStatusIndicator({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-medium z-50">
      <div className="flex items-center justify-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
        No internet connection - Some features may not work
      </div>
    </div>
  );
}

// Helper functions
function detectErrorType(errorMessage: string): ErrorDisplayProps['type'] {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('not found') || message.includes('404')) {
    return 'not-found';
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('403')) {
    return 'permission';
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
    return 'validation';
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('internal')) {
    return 'server';
  }
  
  return 'generic';
}

function getErrorConfig(type: ErrorDisplayProps['type']) {
  const configs = {
    'network': {
      title: 'Connection Problem',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      ),
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
        'Check if Pipedrive is experiencing issues'
      ]
    },
    'not-found': {
      title: 'Deal Not Found',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      suggestions: [
        'Check if the deal ID is correct',
        'The deal might have been deleted',
        'Try searching for the deal in the deals list',
        'Contact your administrator if you believe this is an error'
      ]
    },
    'permission': {
      title: 'Access Denied',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      suggestions: [
        'You may not have permission to view this deal',
        'Contact your administrator for access',
        'Try logging out and back in',
        'Check if your Pipedrive account is active'
      ]
    },
    'validation': {
      title: 'Invalid Request',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      suggestions: [
        'The request contains invalid data',
        'Try refreshing the page',
        'Check if all required fields are filled',
        'Contact support if the problem persists'
      ]
    },
    'server': {
      title: 'Server Error',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      suggestions: [
        'The server is experiencing issues',
        'Try again in a few minutes',
        'Check Pipedrive status page',
        'Contact support if the issue persists'
      ]
    },
    'generic': {
      title: 'Something went wrong',
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Try again in a few minutes',
        'Contact support if the problem continues'
      ]
    }
  };
  
  return configs[type] || configs.generic;
} 