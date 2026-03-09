# Agentforce Retail Advisor - API Setup Guide

This guide provides step-by-step instructions for setting up all the required API credentials and integrations for the Agentforce Retail Advisor application.

## 1. Agentforce Integration Setup

### Prerequisites
- Salesforce Developer Org or Production Org with Agentforce enabled
- Admin access to Salesforce org

### Steps to Create Agentforce Connected App

1. **Navigate to Setup** in your Salesforce org
2. **Go to App Manager** (Setup → App Manager)
3. **Look for "New Connected App" or "Connected Apps"** and click it
4. **Fill in the following details:**
   - **Connected App Name**: Agentforce Advisor
   - **API Name**: AgentforceAdvisor
   - **Contact Email**: [Your email address]

5. **Enable OAuth Settings:**
   - Check "Enable OAuth Settings"
   - **Callback URL**: https://your-domain.com/oauth/callback (update for your deployment)
   - **Selected OAuth Scopes**:
     - Full Access (full)
     - Refresh Token (refresh_token)
     - API (api)

6. **Save the Connected App**

7. **Note the Consumer Key and Consumer Secret** - these will be used in your .env.local file

### Getting Your Agentforce Base URL
- Navigate to your Salesforce org
- The base URL is typically: `https://your-instance.salesforce.com`
- For sandbox orgs: `https://your-instance-dev-ed.my.salesforce.com`

### Getting Your Agentforce Agent ID
- Go to Einstein AI → Agents in Salesforce Setup
- Find your "Beauty Advisor" agent
- Copy the Agent ID from the URL or agent details page

### Getting Your Access Token
After creating the Connected App, you'll need to generate an access token through OAuth flow:
1. Use the Consumer Key and Consumer Secret from your Connected App
2. Make an OAuth request to get the access token
3. The token will be used in your .env.local file

## 2. Adobe Firefly API Setup

### Prerequisites
- Adobe Developer Account
- Access to Adobe Firefly API

### Steps to Get API Key
1. Visit [Adobe Developer Console](https://developer.adobe.com/)
2. Sign in with your Adobe ID
3. Create a new project or select existing project
4. Enable the Firefly API for your project
5. Generate an API key
6. Copy the API key for use in your .env.local file

## 3. Commerce Cloud Setup

### Prerequisites
- Salesforce Commerce Cloud instance
- Admin access to Commerce Cloud

### Steps to Get Credentials
1. Log into your Salesforce Commerce Cloud admin console
2. Navigate to Administration → System → OAuth
3. Create a new OAuth client application
4. Note the Client ID, Site ID, and generate an Access Token
5. The base URL is typically: `https://your-instance.commercecloud.salesforce.com`

## 4. Data Cloud Setup

### Prerequisites
- Salesforce Data Cloud license
- Admin access to Data Cloud

### Steps to Get Credentials
1. Log into your Salesforce org with Data Cloud access
2. Navigate to Data Cloud settings
3. Create a service account or use existing credentials
4. Generate an access token
5. The base URL is typically: `https://your-instance.salesforce.com`
6. Get a test customer ID from your Data Cloud

## 5. Environment Configuration

Update your `.env.local` file with the actual values you obtained:

```bash
# 1. Agentforce — REQUIRED to replace mock agent
VITE_AGENTFORCE_BASE_URL=https://YOUR-INSTANCE.salesforce.com/services/data/v60.0/einstein/ai-agents
VITE_AGENTFORCE_AGENT_ID=<your-agent-id>
VITE_AGENTFORCE_ACCESS_TOKEN=<your-access-token>

# 2. Adobe Firefly — REQUIRED for generative backgrounds
VITE_FIREFLY_API_KEY=<your-firefly-api-key>

# 3. Commerce Cloud — REQUIRED for real product catalog & checkout
VITE_COMMERCE_BASE_URL=https://YOUR-INSTANCE.commercecloud.salesforce.com
VITE_COMMERCE_CLIENT_ID=<your-client-id>
VITE_COMMERCE_SITE_ID=<your-site-id>
VITE_COMMERCE_ACCESS_TOKEN=<your-access-token>

# 4. Data Cloud — REQUIRED for real customer profiles
VITE_DATACLOUD_BASE_URL=https://YOUR-INSTANCE.salesforce.com
VITE_DATACLOUD_ACCESS_TOKEN=<your-access-token>
VITE_CUSTOMER_ID=<test-customer-id>

# 5. Feature flags — flip these when ready
VITE_USE_MOCK_DATA=false
VITE_ENABLE_GENERATIVE_BACKGROUNDS=true
```

## 6. Deployment and Testing

Once you've configured all credentials:
1. Save your `.env.local` file
2. Deploy your Salesforce metadata:
   ```
   sf deploy metadata --source-dir salesforce/force-app/main/default/connectedApps
   ```
3. Start your development server:
   ```
   npm run dev
   ```

## Troubleshooting

### Common Issues:
- **Authentication Errors**: Double-check your OAuth credentials and scopes
- **URL Issues**: Ensure your Salesforce instance URL is correct
- **Permission Issues**: Verify your connected app has proper permissions
- **Token Expiration**: Access tokens may expire and require regeneration

### Testing Your Configuration:
1. Check that your `.env.local` file has all required values
2. Verify your Salesforce Connected App is active
3. Test API connections using tools like Postman or curl
4. Monitor your application logs for authentication errors

## Additional Resources

- [Salesforce Connected App Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connected_app.htm)
- [Adobe Firefly API Documentation](https://developer.adobe.com/firefly/docs/)
- [Salesforce Commerce Cloud Documentation](https://documentation.b2c.commercecloud.salesforce.com/)
- [Salesforce Data Cloud Documentation](https://help.salesforce.com/s/articleView?id=sf.data_cloud.htm&type=5)
