/**
 * ProfileEnrichmentService - Invocable Apex action for capturing and storing
 * profile fields that the agent discovers conversationally.
 *
 * These are fields that would be intrusive to ask via a form but are natural
 * to capture during conversation: birthday, anniversary, partner name,
 * morning routine, exercise habits, work environment, beauty priorities, etc.
 */
global with sharing class ProfileEnrichmentService {

    // Allowed field names that can be captured
    private static final Set<String> ALLOWED_FIELDS = new Set<String>{
        'birthday', 'anniversary', 'partnerName', 'giftsFor',
        'upcomingOccasions', 'morningRoutineTime', 'makeupFrequency',
        'exerciseRoutine', 'workEnvironment', 'beautyPriority',
        'priceRange', 'sustainabilityPref', 'climateContext',
        'waterIntake', 'sleepPattern'
    };

    public class ProfileFieldRequest {
        @InvocableVariable(required=true label='Customer ID')
        public String customerId;

        @InvocableVariable(required=true label='Field Name')
        public String fieldName; // e.g. "birthday", "anniversary", "workEnvironment"

        @InvocableVariable(required=true label='Field Value')
        public String fieldValue; // The captured value (plain string or JSON array)

        @InvocableVariable(required=true label='Confidence')
        public String confidence; // "stated" or "inferred"

        @InvocableVariable(required=true label='Session ID')
        public String sessionId;

        @InvocableVariable(required=false label='Data Type')
        public String dataType; // "string" (default) or "array"
    }

    public class ProfileFieldResult {
        @InvocableVariable
        public Boolean success;

        @InvocableVariable
        public String fieldName;

        @InvocableVariable
        public String errorMessage;
    }

    @InvocableMethod(label='Capture Profile Field' description='Captures a conversationally-discovered profile field and stores it in Data Cloud')
    public static List<ProfileFieldResult> captureProfileField(List<ProfileFieldRequest> requests) {
        List<ProfileFieldResult> results = new List<ProfileFieldResult>();

        for (ProfileFieldRequest req : requests) {
            ProfileFieldResult result = new ProfileFieldResult();
            result.fieldName = req.fieldName;

            try {
                // Validate field name
                if (!ALLOWED_FIELDS.contains(req.fieldName)) {
                    result.success = false;
                    result.errorMessage = 'Invalid field name: ' + req.fieldName +
                        '. Allowed fields: ' + String.join(new List<String>(ALLOWED_FIELDS), ', ');
                    results.add(result);
                    continue;
                }

                // Validate confidence
                if (req.confidence != 'stated' && req.confidence != 'inferred') {
                    result.success = false;
                    result.errorMessage = 'Confidence must be "stated" or "inferred", got: ' + req.confidence;
                    results.add(result);
                    continue;
                }

                // Determine data type
                String dataType = String.isNotBlank(req.dataType) ? req.dataType : 'string';

                // Array fields: giftsFor, upcomingOccasions
                if ((req.fieldName == 'giftsFor' || req.fieldName == 'upcomingOccasions') && dataType == 'string') {
                    dataType = 'array';
                    // Wrap in JSON array if not already
                    if (!req.fieldValue.startsWith('[')) {
                        req.fieldValue = '["' + req.fieldValue.replace(',', '","').trim() + '"]';
                    }
                }

                // Persist to Data Cloud
                DataCloudProfileService.writeCapturedProfileField(
                    req.customerId, req.sessionId,
                    req.fieldName, req.fieldValue,
                    req.confidence, dataType
                );

                result.success = true;
            } catch (Exception e) {
                result.success = false;
                result.errorMessage = e.getMessage();
            }
            results.add(result);
        }

        return results;
    }
}
