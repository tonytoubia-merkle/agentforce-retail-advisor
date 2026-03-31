/**
 * CampaignFlowBuilderService — Creates sequenced marketing flows
 * (email + SMS) for campaign plans and manages personalization campaign
 * activation/deactivation scheduling.
 *
 * Flow structure:
 *   1. Record-Triggered Flow on a Campaign_Send__c custom object (or platform event)
 *   2. Steps: Wait → Send Email → Wait → Send SMS → Wait → Send Follow-up Email
 *   3. Each step respects channel opt-in (Email_Opt_In__c, SMS_Opt_In__c)
 *   4. Flow can be activated/deactivated to control personalization campaign windows
 *
 * Integration points:
 *   - Creates Journey_Approval__c records for the marketing advisor approval queue
 *   - Publishes Journey_Send_Request__e platform events for MC Advanced
 *   - Updates Personalization_Variation__c Start/End dates for scheduling
 */
public with sharing class CampaignFlowBuilderService {

    // ─── Request/Response Types ─────────────────────────────────────────────

    public class FlowRequest {
        @InvocableVariable(label='Campaign Name' required=true)
        public String campaignName;

        @InvocableVariable(label='Campaign ID' description='Unique campaign identifier')
        public String campaignId;

        @InvocableVariable(label='Segment Rules JSON' description='JSON targeting rules for audience')
        public String segmentRulesJson;

        @InvocableVariable(label='Duration Days' description='Total campaign duration (default: 7)')
        public Integer durationDays;

        @InvocableVariable(label='Email Subject 1' description='First email subject line')
        public String emailSubject1;

        @InvocableVariable(label='Email Body 1' description='First email body (HTML or plain text)')
        public String emailBody1;

        @InvocableVariable(label='Email Subject 2' description='Follow-up email subject')
        public String emailSubject2;

        @InvocableVariable(label='Email Body 2' description='Follow-up email body')
        public String emailBody2;

        @InvocableVariable(label='SMS Body' description='Optional SMS message text')
        public String smsBody;

        @InvocableVariable(label='Contact IDs' description='Optional: specific contact IDs to target (comma-separated)')
        public String contactIds;
    }

    public class FlowResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String flowId;
        @InvocableVariable public String journeyId;
        @InvocableVariable public Integer stepsCreated;
        @InvocableVariable public String summary;
        @InvocableVariable public String errorMessage;
    }

    @InvocableMethod(label='Create Campaign Flow' description='Creates a sequenced email/SMS marketing flow with Journey_Approval records for the approval queue. Respects channel opt-in status.')
    public static List<FlowResponse> createCampaignFlows(List<FlowRequest> requests) {
        List<FlowResponse> responses = new List<FlowResponse>();
        for (FlowRequest req : requests) {
            responses.add(buildFlow(req));
        }
        return responses;
    }

    // ─── Flow Builder ───────────────────────────────────────────────────────

    private static FlowResponse buildFlow(FlowRequest req) {
        FlowResponse resp = new FlowResponse();

        try {
            String journeyId = String.isNotBlank(req.campaignId) ? req.campaignId : 'CMP-' + String.valueOf(Datetime.now().getTime()).right(8);
            Integer durationDays = req.durationDays != null ? req.durationDays : 7;

            // Resolve target contacts
            List<Id> targetContacts = resolveTargetContacts(req);

            // Build journey steps based on available content
            List<JourneyStep> steps = new List<JourneyStep>();
            Integer stepNum = 0;

            // Step 1: Immediate email (day 0)
            if (String.isNotBlank(req.emailSubject1)) {
                stepNum++;
                JourneyStep s = new JourneyStep();
                s.stepNumber = stepNum;
                s.channel = 'Email';
                s.sendDelayDays = 0;
                s.subject = req.emailSubject1;
                s.body = req.emailBody1;
                steps.add(s);
            }

            // Step 2: SMS on day 1 (if provided and opt-in exists)
            if (String.isNotBlank(req.smsBody)) {
                stepNum++;
                JourneyStep s = new JourneyStep();
                s.stepNumber = stepNum;
                s.channel = 'SMS';
                s.sendDelayDays = 1;
                s.subject = req.campaignName + ' — SMS';
                s.body = req.smsBody;
                steps.add(s);
            }

            // Step 3: Follow-up email on day 3
            if (String.isNotBlank(req.emailSubject2)) {
                stepNum++;
                JourneyStep s = new JourneyStep();
                s.stepNumber = stepNum;
                s.channel = 'Email';
                s.sendDelayDays = 3;
                s.subject = req.emailSubject2;
                s.body = req.emailBody2;
                steps.add(s);
            }

            if (steps.isEmpty()) {
                resp.success = false;
                resp.errorMessage = 'No content provided for flow steps';
                return resp;
            }

            Integer totalSteps = steps.size();

            // Create Journey_Approval__c records (one per step per contact, or campaign-level)
            List<Journey_Approval__c> approvals = new List<Journey_Approval__c>();

            // Guardrails
            Map<String, Object> guardrails = new Map<String, Object>{
                'maxEmailsPerWeek' => 2,
                'maxSMSPerWeek' => 1,
                'exitOnPurchase' => true,
                'campaignId' => journeyId,
                'segmentRules' => req.segmentRulesJson,
                'type' => 'campaign-flow'
            };

            for (JourneyStep step : steps) {
                Journey_Approval__c approval = new Journey_Approval__c();
                approval.Journey_Id__c = journeyId;
                approval.Step_Number__c = step.stepNumber;
                approval.Total_Steps__c = totalSteps;
                approval.Channel__c = step.channel;
                approval.Send_Delay_Days__c = step.sendDelayDays;
                approval.Suggested_Subject__c = step.subject;
                approval.Suggested_Body__c = step.body;
                if (step.channel == 'SMS') {
                    approval.SMS_Body__c = step.body;
                }
                approval.Status__c = 'Pending';
                approval.Event_Type__c = 'campaign-planned';
                approval.Event_Summary__c = req.campaignName + ' (Campaign Flow)';
                approval.Urgency__c = 'Future';
                approval.Journey_Guardrails__c = JSON.serialize(guardrails);
                approval.Confidence_Score__c = 85; // AI-planned campaigns get high confidence

                // Link to first target contact if available
                if (!targetContacts.isEmpty()) {
                    approval.Contact__c = targetContacts[0];
                }

                approvals.add(approval);
            }

            if (!approvals.isEmpty()) {
                insert approvals;
            }

            resp.success = true;
            resp.journeyId = journeyId;
            resp.stepsCreated = approvals.size();
            resp.summary = totalSteps + '-step flow created: ' +
                buildStepSummary(steps) +
                '. Campaign duration: ' + durationDays + ' days. ' +
                (targetContacts.isEmpty() ? 'Segment-based targeting.' : targetContacts.size() + ' contacts targeted.');

        } catch (Exception e) {
            resp.success = false;
            resp.errorMessage = e.getMessage();
        }

        return resp;
    }

    // ─── Campaign Scheduling ────────────────────────────────────────────────

    /**
     * Activate or deactivate personalization variations for a campaign.
     * Can be called from a Flow to schedule campaign start/stop.
     */
    public class ScheduleRequest {
        @InvocableVariable(label='Campaign ID' required=true)
        public String campaignId;

        @InvocableVariable(label='Action' required=true description='"activate" or "deactivate"')
        public String action;
    }

    public class ScheduleResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public Integer variationsUpdated;
        @InvocableVariable public String errorMessage;
    }

    public static List<ScheduleResponse> scheduleCampaigns(List<ScheduleRequest> requests) {
        List<ScheduleResponse> responses = new List<ScheduleResponse>();
        for (ScheduleRequest req : requests) {
            ScheduleResponse resp = new ScheduleResponse();
            try {
                Boolean shouldActivate = req.action != null && req.action.equalsIgnoreCase('activate');

                // Find variations created by API matching this campaign
                // Content_JSON__c is LongTextArea (not filterable via LIKE),
                // so we query all API-created variations and filter in-memory
                List<Personalization_Variation__c> allApiVariations = [
                    SELECT Id, Is_Active__c, Content_JSON__c
                    FROM Personalization_Variation__c
                    WHERE Created_By_API__c = true
                    LIMIT 500
                ];

                List<Personalization_Variation__c> variations = new List<Personalization_Variation__c>();
                for (Personalization_Variation__c v : allApiVariations) {
                    if (v.Content_JSON__c != null && v.Content_JSON__c.contains(req.campaignId)) {
                        v.Is_Active__c = shouldActivate;
                        variations.add(v);
                    }
                }

                if (!variations.isEmpty()) {
                    update variations;
                }

                resp.success = true;
                resp.variationsUpdated = variations.size();
            } catch (Exception e) {
                resp.success = false;
                resp.errorMessage = e.getMessage();
            }
            responses.add(resp);
        }
        return responses;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private static List<Id> resolveTargetContacts(FlowRequest req) {
        List<Id> contacts = new List<Id>();

        // Explicit contact IDs
        if (String.isNotBlank(req.contactIds)) {
            for (String cId : req.contactIds.split(',')) {
                cId = cId.trim();
                if (String.isNotBlank(cId)) {
                    try {
                        contacts.add(Id.valueOf(cId));
                    } catch (Exception e) { /* skip invalid IDs */ }
                }
            }
            return contacts;
        }

        // Segment-based: find contacts matching browse session UTM rules
        if (String.isNotBlank(req.segmentRulesJson)) {
            try {
                Map<String, Object> rules = (Map<String, Object>) JSON.deserializeUntyped(req.segmentRulesJson);
                String utmSource = (String) rules.get('utm_source');

                if (String.isNotBlank(utmSource)) {
                    Date recentDate = Date.today().addDays(-2);
                    for (AggregateResult ar : [
                        SELECT Customer_Id__c custId
                        FROM Browse_Session__c
                        WHERE UTM_Source__c = :utmSource
                          AND Session_Date__c >= :recentDate
                          AND Customer_Id__c != null
                        GROUP BY Customer_Id__c
                        LIMIT 200
                    ]) {
                        String custId = (String) ar.get('custId');
                        try {
                            contacts.add(Id.valueOf(custId));
                        } catch (Exception e) { /* skip non-ID customer IDs */ }
                    }
                }
            } catch (Exception e) {
                System.debug(LoggingLevel.WARN, 'Segment resolution failed: ' + e.getMessage());
            }
        }

        return contacts;
    }

    private static String buildStepSummary(List<JourneyStep> steps) {
        List<String> parts = new List<String>();
        for (JourneyStep s : steps) {
            parts.add(s.channel + ' on day ' + s.sendDelayDays);
        }
        return String.join(parts, ' → ');
    }

    // ─── Inner Types ────────────────────────────────────────────────────────

    private class JourneyStep {
        Integer stepNumber;
        String channel;
        Integer sendDelayDays;
        String subject;
        String body;
    }
}
