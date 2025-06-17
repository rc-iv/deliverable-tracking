declare module 'intuit-oauth' {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'production';
    redirectUri: string;
    logging?: boolean;
  }

  interface AuthorizeUriOptions {
    scope: string[];
    state?: string;
  }

  interface TokenResponse {
    token: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      x_refresh_token_expires_in: number;
      id_token?: string;
      realmId: string;
    };
    response: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
    };
    body: string;
    json: any;
    intuit_tid: string;
  }

  interface RevokeTokenOptions {
    access_token: string;
    refresh_token: string;
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);
    
    authorizeUri(options: AuthorizeUriOptions): string;
    
    createToken(authorizationCode: string): Promise<TokenResponse>;
    
    refreshUsingToken(refreshToken: string): Promise<TokenResponse>;
    
    revoke(options: RevokeTokenOptions): Promise<void>;
  }

  export = OAuthClient;
} 