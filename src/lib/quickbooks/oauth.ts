import OAuthClient from 'intuit-oauth';
import { QuickBooksTokens, QuickBooksAuthResponse, QuickBooksConfig } from './types';
import { prisma } from '@/lib/prisma';
import { getQuickBooksEnvironment, getQuickBooksConfigInfo } from './config';

export class QuickBooksOAuth {
  private oauthClient: OAuthClient;
  private config: QuickBooksConfig;

  constructor() {
    console.log('🔧 Initializing QuickBooks OAuth client...');
    
    // Load configuration from environment variables
    this.config = this.loadConfig();
    
    // Log configuration info for debugging
    const configInfo = getQuickBooksConfigInfo();
    console.log('🔧 QuickBooks Configuration:', configInfo);
    
    // Initialize the OAuth client
    this.oauthClient = new OAuthClient({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      environment: this.config.environment,
      redirectUri: this.config.redirectUri
    });
    
    console.log('✅ QuickBooks OAuth client initialized');
    console.log('🔧 Environment:', this.config.environment);
    console.log('🔧 Redirect URI:', this.config.redirectUri);
  }

  private loadConfig(): QuickBooksConfig {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback';
    const environment = getQuickBooksEnvironment();

    if (!clientId || !clientSecret) {
      console.error('❌ QuickBooks OAuth credentials not found in environment variables');
      throw new Error('QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET environment variables are required');
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      environment,
      scope: ['com.intuit.quickbooks.accounting']
    };
  }

  /**
   * Generate the authorization URL for QuickBooks OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    console.log('🔗 Generating QuickBooks authorization URL...');
    
    const authUri = this.oauthClient.authorizeUri({
      scope: this.config.scope,
      state: state || 'quickbooks-auth'
    });
    
    console.log('✅ Authorization URL generated');
    console.log('🔗 Auth URL:', authUri);
    
    return authUri;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(authorizationCode: string, realmId: string): Promise<QuickBooksTokens> {
    console.log('🔄 Exchanging authorization code for tokens...');
    console.log('📋 Realm ID:', realmId);
    try {
      // The intuit-oauth library does not return createdAt, so use 'any' and manually add it
      const authResponse: any = await this.oauthClient.createToken(
        `?code=${authorizationCode}&realmId=${realmId}`
      );
      console.log('✅ Tokens received successfully');
      console.log('📊 Token info:', {
        token_type: authResponse.token.token_type,
        expires_in: authResponse.token.expires_in,
        realmId: authResponse.token.realmId,
        intuit_tid: authResponse.intuit_tid
      });
      // Add creation timestamp for token expiry tracking
      const tokens: QuickBooksTokens = {
        ...authResponse.token,
        realmId,
        createdAt: Date.now()
      };
      return tokens;
    } catch (error) {
      console.error('❌ Failed to exchange authorization code for tokens');
      console.error('❌ Error details:', error);
      throw new Error(`OAuth token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<QuickBooksTokens> {
    console.log('🔄 Refreshing QuickBooks access token...');
    try {
      // The intuit-oauth library does not return createdAt, so use 'any' and manually add it
      const authResponse: any = await this.oauthClient.refreshUsingToken(refreshToken);
      console.log('✅ Tokens refreshed successfully');
      console.log('📊 New token info:', {
        token_type: authResponse.token.token_type,
        expires_in: authResponse.token.expires_in,
        intuit_tid: authResponse.intuit_tid
      });
      // Add creation timestamp for token expiry tracking
      const tokens: QuickBooksTokens = {
        ...authResponse.token,
        createdAt: Date.now(),
      };
      return tokens;
    } catch (error) {
      console.error('❌ Failed to refresh tokens');
      console.error('❌ Error details:', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke access token
   */
  async revokeTokens(tokens: QuickBooksTokens): Promise<void> {
    console.log('🗑️ Revoking QuickBooks tokens...');
    
    try {
      await this.oauthClient.revoke({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
      
      console.log('✅ Tokens revoked successfully');
    } catch (error) {
      console.error('❌ Failed to revoke tokens');
      console.error('❌ Error details:', error);
      throw new Error(`Token revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if access token is valid (not expired)
   */
  isTokenValid(tokens: QuickBooksTokens): boolean {
    const now = Date.now();
    const tokenAge = now - tokens.createdAt;
    const expiryTime = tokens.expires_in * 1000; // Convert seconds to milliseconds
    
    const isValid = tokenAge < expiryTime;
    
    console.log('🔍 Token validity check:', {
      created_at: new Date(tokens.createdAt).toISOString(),
      age_minutes: Math.floor(tokenAge / (1000 * 60)),
      expires_in_minutes: Math.floor(expiryTime / (1000 * 60)),
      is_valid: isValid
    });
    
    return isValid;
  }

  /**
   * Check if refresh token is valid (not expired)
   */
  isRefreshTokenValid(tokens: QuickBooksTokens): boolean {
    const now = Date.now();
    const tokenAge = now - tokens.createdAt;
    const refreshExpiryTime = tokens.x_refresh_token_expires_in * 1000; // Convert seconds to milliseconds
    
    const isValid = tokenAge < refreshExpiryTime;
    
    console.log('🔍 Refresh token validity check:', {
      created_at: new Date(tokens.createdAt).toISOString(),
      age_days: Math.floor(tokenAge / (1000 * 60 * 60 * 24)),
      expires_in_days: Math.floor(refreshExpiryTime / (1000 * 60 * 60 * 24)),
      is_valid: isValid
    });
    
    return isValid;
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): Omit<QuickBooksConfig, 'clientSecret'> {
    return {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      environment: this.config.environment,
      scope: this.config.scope
    };
  }
}

/**
 * Utility: Perform a QuickBooks API call with automatic token refresh
 * @param realmId - The QuickBooks company realmId
 * @param apiCall - A function that takes a valid access token and returns a Promise<any>
 * @returns The result of the API call
 */
export async function withQuickBooksAuth<T>(realmId: string, apiCall: (accessToken: string, realmId: string) => Promise<T>) {
  // Get the token record from the database
  let tokenRecord = await prisma.quickBooksToken.findUnique({ where: { realmId } });
  if (!tokenRecord) throw new Error('No QuickBooks token found for this realmId');

  const oauth = new QuickBooksOAuth();
  let accessToken = tokenRecord.accessToken;
  const now = new Date();
  if (tokenRecord.expiresAt <= now) {
    // Token expired, refresh it
    console.log('🔄 Access token expired, refreshing...');
    const refreshed = await oauth.refreshTokens(tokenRecord.refreshToken);
    // Update DB
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    const refreshExpiresAt = new Date(Date.now() + refreshed.x_refresh_token_expires_in * 1000);
    await prisma.quickBooksToken.update({
      where: { realmId },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt,
        refreshExpiresAt,
        updatedAt: new Date(),
      },
    });
    accessToken = refreshed.access_token;
    console.log('✅ Token refreshed and updated in DB');
  }
  // Perform the API call with a valid access token
  return apiCall(accessToken, realmId);
} 