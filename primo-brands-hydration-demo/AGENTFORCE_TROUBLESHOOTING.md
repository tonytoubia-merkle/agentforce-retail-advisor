# Agentforce Integration Troubleshooting Guide

## Issue Analysis

From your PowerShell output, you're experiencing 404 Not Found errors when trying to access Agentforce API endpoints. This typically occurs due to:

1. **Incorrect API endpoints**
2. **Wrong agent IDs**
3. **Authentication issues**
4. **Outdated API versions**

## Common Causes and Solutions

### 1. Check Your Agentforce Configuration

Verify the values in your `.env.local` file:

```bash
# Make sure these match your actual Salesforce org
VITE_AGENTFORCE_BASE_URL=https://api.salesforce.com/einstein/ai-agent/v1
VITE_AGENTFORCE_AGENT_ID=1bYKa000000blNpMAI  # This should be your actual agent ID
VITE_AGENTFORCE_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN>
```

### 2. Verify Agent ID in Salesforce

1. Go to **Setup** → **Einstein AI** → **Agents**
2. Find your "Beauty Advisor" agent
3. Copy the exact agent ID from the URL or agent details page
4. Update your `.env.local` file with the correct ID

### 3. Check API Endpoint Format

The correct Agentforce API endpoint format should be:
```
https://api.salesforce.com/einstein/ai-agent/v1/agents/{AGENT_ID}/sessions
```

### 4. Authentication Flow Issues

Make sure you're using the correct OAuth flow:
1. **Client Credentials Flow** for backend services
2. **Authorization Code Flow** for user-facing applications

## Corrected PowerShell Script Template

```powershell
# Get fresh token
$tokenResponse = Invoke-RestMethod -Uri "https://me1769724439764.my.salesforce.com/services/oauth2/token" -Method POST -Body @{
    grant_type = "client_credentials"
    client_id = "<YOUR_CONSUMER_KEY>"
    client_secret = "<YOUR_CONSUMER_SECRET>"
}

# Create session with correct endpoint
$sessionBody = @{
    externalSessionKey = [guid]::NewGuid().ToString()
    instanceConfig = @{
        endpoint = "https://me1769724439764.my.salesforce.com"
    }
    streamingCapabilities = @{
        chunkTypes = @("Text")
    }
    bypassUser = $true
} | ConvertTo-Json

try {
    $session = Invoke-RestMethod -Uri "https://api.salesforce.com/einstein/ai-agent/v1/agents/1bYKa000000blNpMAI/sessions" -Method POST -Headers @{
        Authorization = "Bearer $($tokenResponse.access_token)"
        "Content-Type" = "application/json"
        "x-sfdc-app-context" = "EinsteinGPT"
    } -Body $sessionBody
    
    Write-Host "Session created: $($session | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        Write-Host "Body: $body"
    } catch { 
        Write-Host "Could not read body" 
    }
}
```

## Debugging Steps

1. **Verify OAuth Token Generation**:
   ```powershell
   $tokenResponse = Invoke-RestMethod -Uri "https://me1769724439764.my.salesforce.com/services/oauth2/token" -Method POST -Body @{
       grant_type = "client_credentials"
       client_id = "YOUR_CLIENT_ID"
       client_secret = "YOUR_CLIENT_SECRET"
   }
   Write-Host "Token: $($tokenResponse.access_token)"
   ```

2. **Test Basic API Access**:
   ```powershell
   $headers = @{
       Authorization = "Bearer $($tokenResponse.access_token)"
       "Content-Type" = "application/json"
   }
   
   # Test if you can access the agent
   $agentInfo = Invoke-RestMethod -Uri "https://api.salesforce.com/einstein/ai-agent/v1/agents/1bYKa000000blNpMAI" -Method GET -Headers $headers
   Write-Host "Agent Info: $($agentInfo | ConvertTo-Json -Depth 3)"
   ```

## Additional Resources

- [Salesforce Agentforce API Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_connected_app.htm)
- [Salesforce OAuth Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_oauth_flow.htm)
- [Salesforce API Explorer](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_api_explorer.htm)

## Next Steps

1. **Double-check your agent ID** in Salesforce
2. **Verify your Connected App settings** in Salesforce
3. **Confirm the correct API endpoint** format
4. **Test with a simple GET request** to verify authentication
