'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class DealErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Deal Error Boundary caught an error:', error);
    console.error('📊 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Force a re-render by reloading the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Something went wrong with the deal page
                  </h3>
                  
                  <div className="text-sm text-red-700 mb-4">
                    <p className="mb-2">
                      We encountered an unexpected error while loading the deal information. 
                      This might be due to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Network connectivity issues</li>
                      <li>Pipedrive API temporary unavailability</li>
                      <li>Invalid deal data format</li>
                      <li>Browser compatibility issues</li>
                    </ul>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mb-4">
                      <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                        Technical Details (Development Mode)
                      </summary>
                      <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                        <div className="mb-2">
                          <strong>Error:</strong> {this.state.error.message}
                        </div>
                        <div className="mb-2">
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={this.handleRetry}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Again
                    </button>
                    
                    <Link
                      href="/deals"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Deals
                    </Link>
                    
                    <button
                      onClick={() => window.location.href = 'mailto:support@example.com?subject=Deal Page Error&body=' + encodeURIComponent(`Error: ${this.state.error?.message}\n\nURL: ${window.location.href}\n\nTime: ${new Date().toISOString()}`)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useDealErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`🚨 Deal Error${context ? ` (${context})` : ''}:`, error);
    
    // You could integrate with error reporting service here
    // e.g., Sentry, LogRocket, etc.
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  };

  const isNetworkError = (error: unknown): boolean => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      return true;
    }
    
    return false;
  };

  return {
    handleError,
    getErrorMessage,
    isNetworkError
  };
} 