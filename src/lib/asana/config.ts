export interface AsanaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiBaseUrl: string;
}

export function getAsanaConfig(): AsanaConfig {
  const clientId = process.env.ASANA_CLIENT_ID;
  const clientSecret = process.env.ASANA_CLIENT_SECRET;
  const redirectUri = process.env.ASANA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing required Asana environment variables: ASANA_CLIENT_ID, ASANA_CLIENT_SECRET, ASANA_REDIRECT_URI'
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    apiBaseUrl: 'https://app.asana.com/api/1.0',
  };
}

export function buildAsanaApiUrl(endpoint: string): string {
  const config = getAsanaConfig();
  return `${config.apiBaseUrl}${endpoint}`;
}

export function getAsanaOAuthUrl(state?: string): string {
  const config = getAsanaConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state: state || 'default',
  });

  return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
}
