import { getAsanaConfig } from "./config";

export interface AsanaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export async function exchangeCodeForToken(code: string): Promise<AsanaTokenResponse> {
  const config = getAsanaConfig();
  
  const response = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<AsanaTokenResponse> {
  const config = getAsanaConfig();
  
  const response = await fetch("https://app.asana.com/-/oauth_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  return response.json();
}

export function validateToken(token: string): boolean {
  // Basic validation - check if token exists and has reasonable length
  return Boolean(token && token.length > 10);
}
