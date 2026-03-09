// Refresh the Tooling API access token stored in Custom Setting.
// Run this before demos: sf apex run --file scripts/refresh-tooling-token.apex --target-org my-org
//
// Anonymous Apex runs with an API-capable session from the CLI.
// We store that session in a Custom Setting so Lightning Apex can use it.

String token = UserInfo.getSessionId();

if (String.isBlank(token)) {
    System.debug('ERROR: No session ID available');
} else {
    // Verify the token works for Tooling API
    String baseUrl = URL.getOrgDomainUrl().toExternalForm();
    HttpRequest req = new HttpRequest();
    req.setEndpoint(baseUrl + '/services/data/v60.0/tooling/query/?q=SELECT+Id+FROM+FlowDefinition+LIMIT+1');
    req.setMethod('GET');
    req.setHeader('Authorization', 'Bearer ' + token);
    req.setTimeout(10000);
    HttpResponse resp = new Http().send(req);

    if (resp.getStatusCode() == 200) {
        // Token is valid — store it in Custom Setting
        Tooling_API_Config__c config = Tooling_API_Config__c.getOrgDefaults();
        config.Access_Token__c = token;
        upsert config;
        System.debug('SUCCESS: Tooling API token stored. Length: ' + token.length());
    } else {
        System.debug('ERROR: Token failed Tooling API test (' + resp.getStatusCode() + '): ' + resp.getBody());
    }
}
