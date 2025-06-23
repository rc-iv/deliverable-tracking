import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = 'bodoggos131';

export function verifyAdminPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return false;
  }

  // Check for Basic auth format: "Basic base64(username:password)"
  if (authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    // For simplicity, we'll accept any username with the correct password
    return password === ADMIN_PASSWORD;
  }

  // Check for Bearer token format: "Bearer password"
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === ADMIN_PASSWORD;
  }

  // Check for custom header: "X-Admin-Password"
  const customPassword = request.headers.get('x-admin-password');
  if (customPassword === ADMIN_PASSWORD) {
    return true;
  }

  return false;
}

export function requireAdminAuth(request: NextRequest): NextResponse | null {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin password required.' },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"'
        }
      }
    );
  }
  
  return null; // Authentication successful
}

export function createAdminAuthHeaders(): Record<string, string> {
  const credentials = Buffer.from(`admin:${ADMIN_PASSWORD}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`
  };
} 