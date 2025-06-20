/**
 * QuickBooks Configuration Utilities
 * Handles environment-specific configuration for sandbox vs production
 */

export type QuickBooksEnvironment = 'sandbox' | 'production';

/**
 * Get the QuickBooks API base URL based on environment
 */
export function getQuickBooksApiBaseUrl(environment: QuickBooksEnvironment = 'sandbox'): string {
  switch (environment) {
    case 'production':
      return 'https://quickbooks.api.intuit.com';
    case 'sandbox':
    default:
      return 'https://sandbox-quickbooks.api.intuit.com';
  }
}

/**
 * Get the current QuickBooks environment from environment variables
 */
export function getQuickBooksEnvironment(): QuickBooksEnvironment {
  return (process.env.QUICKBOOKS_ENVIRONMENT as QuickBooksEnvironment) || 'sandbox';
}

/**
 * Get the current QuickBooks API base URL
 */
export function getCurrentQuickBooksApiBaseUrl(): string {
  const environment = getQuickBooksEnvironment();
  return getQuickBooksApiBaseUrl(environment);
}

/**
 * Build a complete QuickBooks API URL for a specific endpoint
 */
export function buildQuickBooksApiUrl(
  endpoint: string, 
  realmId: string, 
  environment?: QuickBooksEnvironment
): string {
  // Use the current environment if none is specified
  const env = environment || getQuickBooksEnvironment();
  const baseUrl = getQuickBooksApiBaseUrl(env);
  return `${baseUrl}/v3/company/${realmId}${endpoint}`;
}

/**
 * Get configuration info for debugging
 */
export function getQuickBooksConfigInfo() {
  const environment = getQuickBooksEnvironment();
  const baseUrl = getQuickBooksApiBaseUrl(environment);
  
  return {
    environment,
    baseUrl,
    clientId: process.env.QUICKBOOKS_CLIENT_ID ? '***configured***' : '***missing***',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET ? '***configured***' : '***missing***',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback'
  };
} 