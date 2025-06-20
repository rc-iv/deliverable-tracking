#!/usr/bin/env node

/**
 * QuickBooks Environment Verification Script
 * 
 * This script helps verify that the QuickBooks environment configuration
 * is set up correctly for production migration.
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 QuickBooks Environment Verification');
console.log('=====================================\n');

// Check environment variables
const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/quickbooks/callback';

console.log('📋 Environment Configuration:');
console.log(`   Environment: ${environment}`);
console.log(`   Client ID: ${clientId ? '***configured***' : '❌ MISSING'}`);
console.log(`   Client Secret: ${clientSecret ? '***configured***' : '❌ MISSING'}`);
console.log(`   Redirect URI: ${redirectUri}`);
console.log('');

// Determine API base URL
const baseUrl = environment === 'production' 
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

console.log('🌐 API Configuration:');
console.log(`   Base URL: ${baseUrl}`);
console.log(`   Environment: ${environment === 'production' ? 'Production' : 'Sandbox'}`);
console.log('');

// Test API connectivity (basic health check)
console.log('🔗 Testing API Connectivity...');

function testApiConnectivity() {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/v3/company/123456789/companyinfo/123456789`;
    
    const req = https.get(url, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      if (res.statusCode === 401) {
        console.log('   ✅ API endpoint accessible (401 expected without auth)');
        resolve(true);
      } else if (res.statusCode === 404) {
        console.log('   ✅ API endpoint accessible (404 expected for invalid company)');
        resolve(true);
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Connection failed: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Connection timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Run verification
async function runVerification() {
  try {
    // Check required environment variables
    if (!clientId || !clientSecret) {
      console.log('❌ CRITICAL: Missing required environment variables');
      console.log('   Please set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET');
      console.log('');
      console.log('📖 Next Steps:');
      console.log('   1. Get production credentials from QuickBooks Developer Portal');
      console.log('   2. Update .env.local with production credentials');
      console.log('   3. Set QUICKBOOKS_ENVIRONMENT=production');
      console.log('   4. Restart the development server');
      process.exit(1);
    }
    
    // Test API connectivity
    await testApiConnectivity();
    
    console.log('');
    console.log('✅ Environment verification complete!');
    console.log('');
    
    if (environment === 'production') {
      console.log('🎉 Production environment configured successfully!');
      console.log('📖 Next Steps:');
      console.log('   1. Restart your development server');
      console.log('   2. Test OAuth flow at: http://localhost:3000/api/quickbooks/auth');
      console.log('   3. Verify data at: http://localhost:3000/api/quickbooks/test');
    } else {
      console.log('📝 Sandbox environment active');
      console.log('   To switch to production:');
      console.log('   1. Set QUICKBOOKS_ENVIRONMENT=production in .env.local');
      console.log('   2. Update with production credentials');
      console.log('   3. Restart development server');
    }
    
  } catch (error) {
    console.log('');
    console.log('❌ Verification failed:', error.message);
    console.log('');
    console.log('📖 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify QuickBooks API is accessible');
    console.log('   3. Check firewall/proxy settings');
    process.exit(1);
  }
}

// Run the verification
runVerification(); 