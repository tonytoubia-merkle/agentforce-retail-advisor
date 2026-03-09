# Agentforce Concierge Connected App

This directory contains the metadata for the OAuth Connected App required for Agentforce integration.

## Setup Instructions

To create the OAuth Connected App in Salesforce:

1. **Navigate to Setup** in your Salesforce org
2. **Go to App Manager** (Setup → App Manager)
3. **Click "New Connected App"**
4. **Fill in the following details:**
   - **Connected App Name**: Agentforce Concierge
   - **API Name**: AgentforceConcierge
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

## Metadata Deployment

This Connected App metadata can be deployed to Salesforce using:
```
sf deploy metadata --source-dir salesforce/force-app/main/default/connectedApps
```

## Environment Variables

After creating the Connected App, update your `.env.local` file with:
```
VITE_AGENTFORCE_BASE_URL=https://your-instance.salesforce.com
VITE_AGENTFORCE_AGENT_ID=your-agent-id
VITE_AGENTFORCE_ACCESS_TOKEN=your-access-token
```

Where the access token is obtained through the OAuth flow using the Consumer Key and Consumer Secret.
