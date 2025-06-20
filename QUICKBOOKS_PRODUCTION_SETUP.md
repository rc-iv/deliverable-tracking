# QuickBooks Production Setup Guide

## Phase 2: OAuth Credentials Setup

### Prerequisites
- ✅ Phase 1 Complete: Environment configuration implemented
- ✅ QuickBooks Developer Account
- ✅ Production QuickBooks company ready for integration

### Step 1: Get Production Credentials

1. **Access QuickBooks Developer Portal**
   - Go to [https://developer.intuit.com/](https://developer.intuit.com/)
   - Sign in to your developer account

2. **Navigate to Your App**
   - Find your QuickBooks app in the developer dashboard
   - Click on your app to access its settings

3. **Switch to Production Environment**
   - In your app settings, look for environment switching
   - Change from "Development" to "Production"
   - Note: This may require app approval from Intuit

4. **Copy Production Credentials**
   - Copy the production **Client ID**
   - Copy the production **Client Secret**
   - Note the production **Redirect URI** (should match your app's callback URL)

### Step 2: Update Environment Variables

Add or update these environment variables in your `.env.local` file:

```bash
# QuickBooks Production Configuration
QUICKBOOKS_ENVIRONMENT=production
QUICKBOOKS_CLIENT_ID=your_production_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_production_client_secret_here
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
```

### Step 3: Test Configuration

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Verify Environment Configuration**
   - Visit: `http://localhost:3000/api/quickbooks/test`
   - Should show:
     - Environment: "production"
     - Base URL: "https://quickbooks.api.intuit.com"
     - Client ID: "***configured***"

3. **Test OAuth Flow**
   - Visit: `http://localhost:3000/api/quickbooks/auth`
   - Should redirect to production QuickBooks authorization
   - Complete OAuth flow with your production company

### Step 4: Verify Production Integration

1. **Check API Endpoints**
   - `/api/quickbooks/customers` - Should fetch from production company
   - `/api/quickbooks/invoices` - Should fetch from production company
   - `/api/quickbooks/payments` - Should fetch from production company

2. **Verify Data**
   - Production company should have real customer/invoice/payment data
   - Data should be different from sandbox test data

### Troubleshooting

#### Common Issues

1. **"App not approved for production"**
   - Solution: Submit app for production approval in developer portal
   - May take 1-2 business days for approval

2. **"Invalid redirect URI"**
   - Solution: Ensure redirect URI in developer portal matches your app's callback URL
   - Common URLs: `http://localhost:3000/api/quickbooks/callback`

3. **"OAuth credentials not found"**
   - Solution: Verify environment variables are set correctly
   - Check `.env.local` file exists and has correct values

4. **"API rate limiting"**
   - Production APIs have stricter rate limits than sandbox
   - Implement proper error handling and retry logic

#### Fallback to Sandbox

If production setup fails, you can quickly switch back to sandbox:

```bash
# In .env.local
QUICKBOOKS_ENVIRONMENT=sandbox
# Keep existing sandbox credentials
```

### Security Notes

- ⚠️ **Never commit production credentials to version control**
- ⚠️ **Use environment variables for all sensitive data**
- ⚠️ **Production contains real financial data - handle with care**
- ⚠️ **Implement proper error handling for production APIs**

### Next Steps

After successful production setup:
- ✅ Phase 3: API Endpoint Updates (already implemented)
- ✅ Phase 4: Production Testing
- 🔄 Complete integration testing with real data 