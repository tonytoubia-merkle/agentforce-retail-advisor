/**
 * MarketingFlowBuilderService
 * Creates actual Salesforce Flow definitions via the Tooling API
 * for MC Advanced marketing flows. Flows are created as Draft on
 * journey generation, activated on approval, and deleted on decline.
 */
public with sharing class MarketingFlowBuilderService {

    private static final String API_VERSION = 'v60.0';

    // Cached access token for this transaction
    private static String cachedAccessToken;

    /**
     * Get an API-capable access token for Tooling API calls.
     * Lightning sessions (UserInfo.getSessionId()) are NOT API-enabled,
     * so we read a pre-stored API token from a Custom Setting.
     * Refresh it before demos: sf apex run --file scripts/refresh-tooling-token.apex --target-org my-org
     */
    private static String getApiSessionId() {
        // Return cached token if already obtained this transaction
        if (String.isNotBlank(cachedAccessToken)) {
            return cachedAccessToken;
        }

        // In test context, use the session directly
        if (Test.isRunningTest()) {
            return UserInfo.getSessionId();
        }

        // Try the stored API token from Custom Setting (works from any context)
        try {
            Tooling_API_Config__c config = Tooling_API_Config__c.getOrgDefaults();
            if (config != null && String.isNotBlank(config.Access_Token__c)) {
                cachedAccessToken = config.Access_Token__c;
                System.debug('Using stored API token from Tooling_API_Config__c');
                return cachedAccessToken;
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'Custom Setting read failed: ' + e.getMessage());
        }

        // Final fallback — UserInfo session (works from anonymous Apex / CLI)
        System.debug(LoggingLevel.WARN, 'Falling back to UserInfo.getSessionId()');
        return UserInfo.getSessionId();
    }

    // ─── Public Result Class ─────────────────────────────────────

    public class FlowResult {
        public Boolean success;
        public String flowId;           // Flow version ID (301...)
        public String flowDefinitionId; // FlowDefinition ID
        public String flowUrl;          // Flow Builder URL
        public String errorMessage;

        public FlowResult() {
            this.success = false;
        }
    }

    // ─── Create Draft Flow ───────────────────────────────────────

    /**
     * Creates a Draft Salesforce Flow from journey approval steps.
     * Uses the Tooling API to POST a new Flow definition.
     *
     * @param journeyId  Unique journey identifier
     * @param steps      List of Journey_Approval__c records (ordered by Step_Number__c)
     * @param contact    Contact record with Email, FirstName, LastName
     * @return FlowResult with flowId and flowUrl
     */
    public static FlowResult createDraftFlow(
        String journeyId,
        List<Journey_Approval__c> steps,
        Contact contact
    ) {
        FlowResult result = new FlowResult();

        if (steps == null || steps.isEmpty()) {
            result.errorMessage = 'No steps provided for flow creation';
            return result;
        }

        try {
            // Build flow name from contact + event info
            String lastName = contact.LastName != null ? contact.LastName.replaceAll('[^a-zA-Z0-9]', '') : 'Unknown';
            String eventType = steps[0].Event_Type__c != null ? steps[0].Event_Type__c.replaceAll('[^a-zA-Z0-9]', '') : 'General';
            // Extract a short suffix from journeyId for uniqueness
            String idSuffix = journeyId.length() > 8 ? journeyId.substring(journeyId.length() - 8) : journeyId;
            idSuffix = idSuffix.replaceAll('[^a-zA-Z0-9]', '');
            String flowApiName = 'JRN_' + lastName + '_' + eventType + '_' + idSuffix;
            String flowLabel = 'Journey: ' + (contact.FirstName != null ? contact.FirstName + ' ' : '') +
                lastName + ' — ' + steps[0].Event_Type__c + ' (' + steps.size() + ' steps)';

            // Build the Flow metadata as JSON (Tooling API accepts JSON representation)
            Map<String, Object> flowMetadata = buildFlowMetadata(flowLabel, flowApiName, steps, contact);

            // POST to Tooling API
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String endpoint = baseUrl + '/services/data/' + API_VERSION + '/tooling/sobjects/Flow';

            Map<String, Object> requestBody = new Map<String, Object>{
                'FullName' => flowApiName,
                'Metadata' => flowMetadata
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + getApiSessionId());
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(requestBody));
            req.setTimeout(30000);

            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 201 || resp.getStatusCode() == 200) {
                Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                result.flowId = (String) responseBody.get('id');
                result.success = true;

                // Look up the FlowDefinition ID for activation later
                result.flowDefinitionId = lookupFlowDefinitionId(flowApiName);
                result.flowUrl = getFlowUrl(result.flowId);

                System.debug('Created draft flow: ' + flowApiName + ' (ID: ' + result.flowId + ')');
            } else {
                result.errorMessage = 'Tooling API error (' + resp.getStatusCode() + '): ' + resp.getBody();
                System.debug(LoggingLevel.ERROR, 'Flow creation failed: ' + result.errorMessage);
            }

        } catch (Exception e) {
            result.errorMessage = 'Flow creation failed: ' + e.getMessage();
            System.debug(LoggingLevel.ERROR, result.errorMessage);
        }

        return result;
    }

    // ─── Activate Flow ───────────────────────────────────────────

    /**
     * Activates a Draft flow by setting its active version number.
     *
     * @param flowDefinitionId  The FlowDefinition ID
     * @return FlowResult
     */
    public static FlowResult activateFlow(String flowDefinitionId) {
        FlowResult result = new FlowResult();

        if (String.isBlank(flowDefinitionId)) {
            result.errorMessage = 'Flow Definition ID is required';
            return result;
        }

        try {
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String endpoint = baseUrl + '/services/data/' + API_VERSION +
                '/tooling/sobjects/FlowDefinition/' + flowDefinitionId;

            // Set activeVersionNumber to 1 to activate the first (and only) version
            Map<String, Object> body = new Map<String, Object>{
                'Metadata' => new Map<String, Object>{
                    'activeVersionNumber' => 1
                }
            };

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('PATCH');
            req.setHeader('Authorization', 'Bearer ' + getApiSessionId());
            req.setHeader('Content-Type', 'application/json');
            req.setBody(JSON.serialize(body));
            req.setTimeout(15000);

            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 204 || resp.getStatusCode() == 200) {
                result.success = true;
                result.flowDefinitionId = flowDefinitionId;
                System.debug('Activated flow: ' + flowDefinitionId);
            } else {
                result.errorMessage = 'Activation failed (' + resp.getStatusCode() + '): ' + resp.getBody();
                System.debug(LoggingLevel.ERROR, result.errorMessage);
            }

        } catch (Exception e) {
            result.errorMessage = 'Flow activation failed: ' + e.getMessage();
        }

        return result;
    }

    // ─── Delete Draft Flow ───────────────────────────────────────

    /**
     * Deletes a Draft flow definition.
     *
     * @param flowId  The Flow version ID (301...)
     * @return FlowResult
     */
    public static FlowResult deleteFlow(String flowId) {
        FlowResult result = new FlowResult();

        if (String.isBlank(flowId)) {
            result.errorMessage = 'Flow ID is required';
            return result;
        }

        try {
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String endpoint = baseUrl + '/services/data/' + API_VERSION +
                '/tooling/sobjects/Flow/' + flowId;

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('DELETE');
            req.setHeader('Authorization', 'Bearer ' + getApiSessionId());
            req.setTimeout(15000);

            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 204 || resp.getStatusCode() == 200) {
                result.success = true;
                System.debug('Deleted flow: ' + flowId);
            } else {
                result.errorMessage = 'Delete failed (' + resp.getStatusCode() + '): ' + resp.getBody();
                System.debug(LoggingLevel.ERROR, result.errorMessage);
            }

        } catch (Exception e) {
            result.errorMessage = 'Flow deletion failed: ' + e.getMessage();
        }

        return result;
    }

    // ─── Flow Builder URL ────────────────────────────────────────

    public static String getFlowUrl(String flowId) {
        return '/builder_platform_interaction/flowBuilder.app?flowId=' + flowId;
    }

    // ─── Private Helpers ─────────────────────────────────────────

    /**
     * Look up the FlowDefinition ID for a given flow API name.
     * Needed to activate/deactivate the flow later.
     */
    private static String lookupFlowDefinitionId(String flowApiName) {
        try {
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String query = 'SELECT+Id+FROM+FlowDefinition+WHERE+DeveloperName=\'' +
                EncodingUtil.urlEncode(flowApiName, 'UTF-8') + '\'+LIMIT+1';
            String endpoint = baseUrl + '/services/data/' + API_VERSION +
                '/tooling/query/?q=' + query;

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + getApiSessionId());
            req.setTimeout(15000);

            HttpResponse resp = new Http().send(req);

            if (resp.getStatusCode() == 200) {
                Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(resp.getBody());
                List<Object> records = (List<Object>) body.get('records');
                if (!records.isEmpty()) {
                    Map<String, Object> record = (Map<String, Object>) records[0];
                    return (String) record.get('Id');
                }
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'FlowDefinition lookup failed: ' + e.getMessage());
        }
        return null;
    }

    /**
     * Builds the Flow metadata as a Map (JSON-serializable) for the Tooling API.
     * Generates an AutoLaunchedFlow with Send Email, Send SMS, and Wait elements.
     */
    private static Map<String, Object> buildFlowMetadata(
        String flowLabel,
        String flowApiName,
        List<Journey_Approval__c> steps,
        Contact contact
    ) {
        Map<String, Object> metadata = new Map<String, Object>();
        metadata.put('apiVersion', 60.0);
        metadata.put('label', flowLabel);
        metadata.put('description', 'Auto-generated marketing flow for journey: ' + steps[0].Event_Type__c +
            '. Contact: ' + contact.FirstName + ' ' + contact.LastName +
            '. Steps: ' + steps.size() + '.');
        metadata.put('interviewLabel', flowLabel + ' {!$Flow.CurrentDateTime}');
        metadata.put('processType', 'AutoLaunchedFlow');
        metadata.put('runInMode', 'SystemModeWithoutSharing');
        metadata.put('status', 'Draft');

        // Build flow elements
        List<Map<String, Object>> actionCalls = new List<Map<String, Object>>();
        List<Map<String, Object>> waits = new List<Map<String, Object>>();
        List<Map<String, Object>> assignments = new List<Map<String, Object>>();

        // Start element
        Map<String, Object> start = new Map<String, Object>();
        start.put('locationX', 50);
        start.put('locationY', 0);

        String previousElementName = null;
        Integer yPos = 100;

        for (Integer i = 0; i < steps.size(); i++) {
            Journey_Approval__c step = steps[i];
            Integer stepNum = step.Step_Number__c != null ? (Integer) step.Step_Number__c : (i + 1);
            String channel = step.Channel__c != null ? step.Channel__c : 'Email';
            Integer delayDays = step.Send_Delay_Days__c != null ? (Integer) step.Send_Delay_Days__c : 0;

            // Add Wait element if delay > 0 and not the first step
            if (delayDays > 0 && i > 0) {
                String waitName = 'Wait_Step_' + stepNum;
                Map<String, Object> waitElement = new Map<String, Object>();
                waitElement.put('name', waitName);
                waitElement.put('label', 'Wait ' + delayDays + ' day(s) before Step ' + stepNum);
                waitElement.put('locationX', 176);
                waitElement.put('locationY', yPos);

                // Wait event (alarm-based)
                Map<String, Object> waitEvent = new Map<String, Object>();
                waitEvent.put('name', waitName + '_Alarm');
                waitEvent.put('eventType', 'AlarmEvent');
                waitEvent.put('conditionLogic', 'and');

                List<Map<String, Object>> waitInputParams = new List<Map<String, Object>>();
                waitInputParams.add(makeParam('TimeOffset', delayDays));
                waitInputParams.add(makeParamStr('TimeOffsetUnit', 'Days'));
                waitEvent.put('inputParameters', waitInputParams);

                waitElement.put('waitEvents', new List<Map<String, Object>>{ waitEvent });
                waits.add(waitElement);

                yPos += 100;

                // Connect previous element to this wait
                if (previousElementName != null) {
                    // Connector is set via the connector property on the previous element
                }
                previousElementName = waitName;
            }

            // Build the action based on channel
            String actionName = 'Send_' + channel + '_Step_' + stepNum;
            String subject = String.isNotBlank(step.Approved_Subject__c) ?
                step.Approved_Subject__c : step.Suggested_Subject__c;
            String body = String.isNotBlank(step.Approved_Body__c) ?
                step.Approved_Body__c : step.Suggested_Body__c;

            if (channel == 'Email') {
                Map<String, Object> emailAction = new Map<String, Object>();
                emailAction.put('name', actionName);
                emailAction.put('label', 'Step ' + stepNum + ': Send Email');
                emailAction.put('actionName', 'emailSimple');
                emailAction.put('actionType', 'emailSimple');
                emailAction.put('locationX', 176);
                emailAction.put('locationY', yPos);

                List<Map<String, Object>> inputParams = new List<Map<String, Object>>();
                inputParams.add(makeParamStr('emailAddresses', contact.Email));
                inputParams.add(makeParamStr('emailSubject', subject != null ? subject : 'Journey Step ' + stepNum));

                // Build email body with image if available
                String emailBody = buildEmailBody(step, contact);
                inputParams.add(makeParamStr('emailBody', emailBody));
                inputParams.add(makeParamStr('senderDisplayName', 'Sephora Beauty'));

                emailAction.put('inputParameters', inputParams);
                actionCalls.add(emailAction);

            } else if (channel == 'SMS') {
                // For SMS, use a custom log assignment (real SMS would use MC SMS action)
                Map<String, Object> smsAction = new Map<String, Object>();
                smsAction.put('name', actionName);
                smsAction.put('label', 'Step ' + stepNum + ': Send SMS');
                smsAction.put('actionName', 'emailSimple');
                smsAction.put('actionType', 'emailSimple');
                smsAction.put('locationX', 176);
                smsAction.put('locationY', yPos);

                // For POC, send SMS content as email with SMS indicator
                List<Map<String, Object>> inputParams = new List<Map<String, Object>>();
                inputParams.add(makeParamStr('emailAddresses', contact.Email));
                inputParams.add(makeParamStr('emailSubject', '[SMS] ' + (subject != null ? subject : 'Journey Step ' + stepNum)));
                String smsBody = step.SMS_Body__c != null ? step.SMS_Body__c : body;
                inputParams.add(makeParamStr('emailBody', '<p>SMS Content:</p><p>' +
                    (smsBody != null ? smsBody : 'Step ' + stepNum + ' SMS message') + '</p>'));
                inputParams.add(makeParamStr('senderDisplayName', 'Sephora Beauty'));

                smsAction.put('inputParameters', inputParams);
                actionCalls.add(smsAction);

            } else if (channel == 'Media') {
                // Media step — log Merkury activation intent
                Map<String, Object> mediaAssignment = new Map<String, Object>();
                mediaAssignment.put('name', actionName);
                mediaAssignment.put('label', 'Step ' + stepNum + ': Merkury Media Activation (' +
                    (step.Media_Platform__c != null ? step.Media_Platform__c : 'CTV') + ')');
                mediaAssignment.put('locationX', 176);
                mediaAssignment.put('locationY', yPos);

                // Use an assignment to log the media activation
                List<Map<String, Object>> assignItems = new List<Map<String, Object>>();
                Map<String, Object> assignItem = new Map<String, Object>();
                assignItem.put('assignToReference', 'mediaActivationLog');
                assignItem.put('operator', 'Assign');
                Map<String, Object> assignValue = new Map<String, Object>();
                assignValue.put('stringValue', 'Merkury: ' +
                    (step.Media_Platform__c != null ? step.Media_Platform__c : 'CTV') +
                    ' — ' + (step.Media_Ad_Format__c != null ? step.Media_Ad_Format__c : 'Pre-Roll'));
                assignItem.put('value', assignValue);
                assignItems.add(assignItem);

                mediaAssignment.put('assignmentItems', assignItems);
                assignments.add(mediaAssignment);
            }

            previousElementName = actionName;
            yPos += 100;
        }

        // Wire up connectors: Start → Step1 → Wait → Step2 → ...
        List<Object> allElements = new List<Object>();
        String firstElementName = null;

        // Interleave waits and actions in order
        Integer waitIdx = 0;
        Integer actionIdx = 0;
        Integer assignIdx = 0;

        for (Integer i = 0; i < steps.size(); i++) {
            Journey_Approval__c step = steps[i];
            Integer stepNum = step.Step_Number__c != null ? (Integer) step.Step_Number__c : (i + 1);
            Integer delayDays = step.Send_Delay_Days__c != null ? (Integer) step.Send_Delay_Days__c : 0;
            String channel = step.Channel__c != null ? step.Channel__c : 'Email';

            // Wait element (if any)
            if (delayDays > 0 && i > 0 && waitIdx < waits.size()) {
                Map<String, Object> waitEl = waits[waitIdx];
                allElements.add(waitEl);
                if (firstElementName == null) firstElementName = (String) waitEl.get('name');
                waitIdx++;
            }

            // Action element
            String actionName = 'Send_' + channel + '_Step_' + stepNum;
            if (channel == 'Media') {
                if (assignIdx < assignments.size()) {
                    Map<String, Object> assignEl = assignments[assignIdx];
                    allElements.add(assignEl);
                    if (firstElementName == null) firstElementName = (String) assignEl.get('name');
                    assignIdx++;
                }
            } else {
                if (actionIdx < actionCalls.size()) {
                    Map<String, Object> actionEl = actionCalls[actionIdx];
                    allElements.add(actionEl);
                    if (firstElementName == null) firstElementName = (String) actionEl.get('name');
                    actionIdx++;
                }
            }
        }

        // Add connectors between elements
        for (Integer i = 0; i < allElements.size() - 1; i++) {
            Map<String, Object> el = (Map<String, Object>) allElements[i];
            Map<String, Object> nextEl = (Map<String, Object>) allElements[i + 1];
            String nextName = (String) nextEl.get('name');

            // For wait elements, the connector goes on the waitEvent
            if (el.containsKey('waitEvents')) {
                List<Map<String, Object>> events = (List<Map<String, Object>>) el.get('waitEvents');
                if (!events.isEmpty()) {
                    events[0].put('connector', new Map<String, Object>{
                        'targetReference' => nextName
                    });
                }
            } else {
                el.put('connector', new Map<String, Object>{
                    'targetReference' => nextName
                });
            }
        }

        // Start connector
        if (firstElementName != null) {
            start.put('connector', new Map<String, Object>{
                'targetReference' => firstElementName
            });
        }
        metadata.put('start', start);

        // Separate elements by type for the metadata structure
        List<Map<String, Object>> finalActions = new List<Map<String, Object>>();
        List<Map<String, Object>> finalWaits = new List<Map<String, Object>>();
        List<Map<String, Object>> finalAssignments = new List<Map<String, Object>>();

        for (Object el : allElements) {
            Map<String, Object> elMap = (Map<String, Object>) el;
            if (elMap.containsKey('waitEvents')) {
                finalWaits.add(elMap);
            } else if (elMap.containsKey('actionName')) {
                finalActions.add(elMap);
            } else if (elMap.containsKey('assignmentItems')) {
                finalAssignments.add(elMap);
            }
        }

        if (!finalActions.isEmpty()) metadata.put('actionCalls', finalActions);
        if (!finalWaits.isEmpty()) metadata.put('waits', finalWaits);
        if (!finalAssignments.isEmpty()) metadata.put('assignments', finalAssignments);

        // Add a variable for media activation logging
        Boolean hasMedia = false;
        for (Journey_Approval__c step : steps) {
            if (step.Channel__c == 'Media') { hasMedia = true; break; }
        }
        if (hasMedia) {
            List<Map<String, Object>> variables = new List<Map<String, Object>>();
            Map<String, Object> mediaVar = new Map<String, Object>();
            mediaVar.put('name', 'mediaActivationLog');
            mediaVar.put('dataType', 'String');
            mediaVar.put('isCollection', false);
            mediaVar.put('isInput', false);
            mediaVar.put('isOutput', false);
            mediaVar.put('description', 'Logs Merkury media activation details');
            variables.add(mediaVar);
            metadata.put('variables', variables);
        }

        return metadata;
    }

    /**
     * Build HTML email body with hero image and personalization.
     */
    private static String buildEmailBody(Journey_Approval__c step, Contact contact) {
        String body = String.isNotBlank(step.Approved_Body__c) ?
            step.Approved_Body__c : step.Suggested_Body__c;
        String firstName = contact.FirstName != null ? contact.FirstName : 'there';
        String imageUrl = step.Generated_Image_URL__c;

        String html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';

        // Hero image
        if (String.isNotBlank(imageUrl)) {
            // Convert relative URLs to absolute
            if (imageUrl.startsWith('/sfc/')) {
                imageUrl = URL.getOrgDomainUrl().toExternalForm() + imageUrl;
            }
            html += '<div style="text-align: center; margin-bottom: 20px;">';
            html += '<img src="' + imageUrl + '" alt="Hero Image" style="max-width: 100%; border-radius: 8px;" />';
            html += '</div>';
        }

        // Body content
        html += '<div style="padding: 0 20px;">';
        html += '<p>Hi ' + firstName + ',</p>';
        if (String.isNotBlank(body)) {
            html += body;
        }
        html += '</div>';
        html += '</div>';

        return html;
    }

    /**
     * Helper to create a string input parameter for flow actions.
     */
    private static Map<String, Object> makeParamStr(String name, String val) {
        Map<String, Object> param = new Map<String, Object>();
        param.put('name', name);
        Map<String, Object> value = new Map<String, Object>();
        value.put('stringValue', val != null ? val : '');
        param.put('value', value);
        return param;
    }

    /**
     * Helper to create a number input parameter for flow actions.
     */
    private static Map<String, Object> makeParam(String name, Integer val) {
        Map<String, Object> param = new Map<String, Object>();
        param.put('name', name);
        Map<String, Object> value = new Map<String, Object>();
        value.put('numberValue', val);
        param.put('value', value);
        return param;
    }
}
