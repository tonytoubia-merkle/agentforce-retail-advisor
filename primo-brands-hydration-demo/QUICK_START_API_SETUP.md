# Quick Start: API Setup for Agentforce Retail Advisor

## Required API Credentials

### 1. Agentforce
- **Base URL**: `https://your-instance.salesforce.com/services/data/v60.0/einstein/ai-agents`
- **Agent ID**: Your deployed Agentforce agent ID
- **Access Token**: OAuth token from your Connected App

### 2. Adobe Firefly
- **API Key**: From Adobe Developer Console

### 3. Commerce Cloud
- **Base URL**: `https://your-instance.commercecloud.salesforce.com`
- **Client ID**: OAuth client ID
- **Site ID**: Your Commerce Cloud site ID
- **Access Token**: OAuth access token

### 4. Data Cloud
- **Base URL**: `https://your-instance.salesforce.com`
- **Access Token**: Data Cloud access token
- **Customer ID**: Test customer ID from Data Cloud

## Environment Variables to Set

In your `.env.local` file:
```bash
VITE_AGENTFORCE_BASE_URL=https://YOUR-INSTANCE.salesforce.com/services/data/v60.0/einstein/ai-agents
VITE_AGENTFORCE_AGENT_ID=<your-agent-id>
VITE_AGENTFORCE_ACCESS_TOKEN=<your-access-token>

VITE_FIREFLY_API_KEY=<your-firefly-api-key>

VITE_COMMERCE_BASE_URL=https://YOUR-INSTANCE.commercecloud.salesforce.com
VITE_COMMERCE_CLIENT_ID=<your-client-id>
VITE_COMMERCE_SITE_ID=<your-site-id>
VITE_COMMERCE_ACCESS_TOKEN=<your-access-token>

VITE_DATACLOUD_BASE_URL=https://YOUR-INSTANCE.salesforce.com
VITE_DATACLOUD_ACCESS_TOKEN=<your-access-token>
VITE_CUSTOMER_ID=<test-customer-id>

VITE_USE_MOCK_DATA=false
VITE_ENABLE_GENERATIVE_BACKGROUNDS=true
```

## Next Steps

1. Set up your Salesforce org and create the Connected App
2. Obtain your Adobe Firefly API key
3. Configure your Commerce Cloud credentials
4. Set up your Data Cloud access
5. Update your `.env.local` file with real values
6. Deploy Salesforce metadata
7. Start the development server

## Resources

- [Complete Setup Guide](AGENTFORCE_SETUP_GUIDE.md)
- [Salesforce Connected App Docs](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connected_app.htm)
- [Adobe Firefly Docs](https://developer.adobe.com/firefly/docs/)
