'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuickBooksTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testQuickBooksSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quickbooks/test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to test QuickBooks setup',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              QuickBooks Integration Testing
            </h1>
            <p className="text-gray-600">
              Test and configure your QuickBooks OAuth integration
            </p>
          </div>

          {/* Test Configuration Button */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Step 1: Test Configuration
            </h2>
            <button
              onClick={testQuickBooksSetup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test QuickBooks Setup'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Test Results
              </h3>
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    testResult.success ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Configuration Valid' : 'Configuration Error'}
                  </span>
                </div>
                
                {testResult.success ? (
                  <div className="text-sm text-green-700">
                    <p className="mb-2">{testResult.message}</p>
                    {testResult.data && (
                      <div className="bg-green-100 p-3 rounded mt-3">
                        <p><strong>Environment:</strong> {testResult.data.configuration?.environment}</p>
                        <p><strong>Client ID:</strong> {testResult.data.configuration?.clientId?.substring(0, 20)}...</p>
                        <p><strong>Redirect URI:</strong> {testResult.data.configuration?.redirectUri}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    <p className="mb-2">{testResult.message}</p>
                    {testResult.suggestions && testResult.suggestions.length > 0 && (
                      <div className="bg-red-100 p-3 rounded mt-3">
                        <p className="font-medium mb-2">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {testResult.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OAuth Flow Testing */}
          {testResult?.success && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Step 2: Test OAuth Flow
              </h2>
              <p className="text-gray-600 mb-4">
                Click the button below to start the QuickBooks OAuth authorization flow.
                You'll be redirected to QuickBooks to authorize the connection.
              </p>
              <Link
                href="/api/quickbooks/auth"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors"
              >
                Start QuickBooks Authorization
              </Link>
            </div>
          )}

          {/* Environment Variables Guide */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Environment Variables Setup
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700 mb-3">
                Add these environment variables to your <code className="bg-gray-200 px-2 py-1 rounded">.env</code> file:
              </p>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox`}
              </pre>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Available API Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Test Endpoint</h3>
                <p className="text-sm text-blue-600 mb-2">
                  <code>/api/quickbooks/test</code>
                </p>
                <p className="text-xs text-blue-500">
                  Tests OAuth configuration without authentication
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Auth Endpoint</h3>
                <p className="text-sm text-green-600 mb-2">
                  <code>/api/quickbooks/auth</code>
                </p>
                <p className="text-xs text-green-500">
                  Initiates OAuth authorization flow
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">Callback Endpoint</h3>
                <p className="text-sm text-purple-600 mb-2">
                  <code>/api/quickbooks/callback</code>
                </p>
                <p className="text-xs text-purple-500">
                  Handles OAuth callback and token exchange
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 