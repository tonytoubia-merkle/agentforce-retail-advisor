/**
 * PersonalizationApiService — wraps Salesforce Personalization REST APIs
 * for engagement signals, recommenders, experiments, and compound metrics.
 *
 * All calls go to: {orgDomain}/services/data/v66.0/personalization/...
 * Auth: Bearer token from Tooling_API_Config__c (same as MarketingFlowBuilderService).
 */
public with sharing class PersonalizationApiService {

    private static final String API_VERSION = 'v66.0';
    private static final String BASE_PATH = '/services/data/' + API_VERSION + '/personalization';
    private static String cachedToken;

    // ─── Result Type ────────────────────────────────────────────────────────

    public class ApiResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String responseJson;
        @AuraEnabled public String errorMessage;
    }

    // ─── Request/Response Types for Invocables ──────────────────────────────

    public class SignalRequest {
        @InvocableVariable(label='Signal Config JSON' description='Full JSON body for the engagement signal creation API')
        public String configJson;
        @InvocableVariable(label='Signal ID' description='Signal ID for delete/metric operations')
        public String signalId;
    }

    public class RecommenderRequest {
        @InvocableVariable(label='Recommender Name' required=true)
        public String name;
        @InvocableVariable(label='Recommender Label' required=true)
        public String label;
        @InvocableVariable(label='Objective Name' description='e.g. Max_Clicks, Max_Revenue')
        public String objectiveName;
        @InvocableVariable(label='Data Space Name' description='Default: default')
        public String dataSpaceName;
        @InvocableVariable(label='Profile Data Graph Name')
        public String profileDataGraphName;
        @InvocableVariable(label='Item Data Graph Name')
        public String itemDataGraphName;
    }

    public class ExperimentRequest {
        @InvocableVariable(label='Experiment Name or ID' required=true)
        public String nameOrId;
        @InvocableVariable(label='Action' description='create, start, stop, archive, delete, status')
        public String action;
        @InvocableVariable(label='Experiment Config JSON' description='Full JSON body for experiment creation')
        public String configJson;
    }

    public class CompoundMetricRequest {
        @InvocableVariable(label='Action' required=true description='list, create, or delete')
        public String action;
        @InvocableVariable(label='Metric Config JSON' description='JSON body for compound metric creation')
        public String configJson;
        @InvocableVariable(label='Metric ID' description='Compound metric ID for delete')
        public String metricId;
    }

    public class ApiResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String responseJson;
        @InvocableVariable public String summary;
        @InvocableVariable public String errorMessage;
    }

    // ─── Auth ───────────────────────────────────────────────────────────────

    private static String getApiSessionId() {
        if (String.isNotBlank(cachedToken)) return cachedToken;
        if (Test.isRunningTest()) return UserInfo.getSessionId();
        try {
            Tooling_API_Config__c config = Tooling_API_Config__c.getOrgDefaults();
            if (config != null && String.isNotBlank(config.Access_Token__c)) {
                cachedToken = config.Access_Token__c;
                return cachedToken;
            }
        } catch (Exception e) { /* fallback */ }
        return UserInfo.getSessionId();
    }

    // ─── Core HTTP Helper ───────────────────────────────────────────────────

    private static ApiResult doCallout(String method, String path, String body) {
        ApiResult result = new ApiResult();
        try {
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String endpoint = baseUrl + BASE_PATH + path;

            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod(method);
            req.setHeader('Authorization', 'Bearer ' + getApiSessionId());
            req.setHeader('Content-Type', 'application/json');
            req.setTimeout(30000);

            if (String.isNotBlank(body) && (method == 'POST' || method == 'PATCH')) {
                req.setBody(body);
            }

            HttpResponse resp = new Http().send(req);
            Integer status = resp.getStatusCode();

            if (status >= 200 && status < 300) {
                result.success = true;
                result.responseJson = resp.getBody();
            } else {
                result.success = false;
                result.errorMessage = 'HTTP ' + status + ': ' + resp.getBody().left(500);
            }
        } catch (Exception e) {
            result.success = false;
            result.errorMessage = e.getMessage();
        }
        return result;
    }

    // ─── Engagement Signals ─────────────────────────────────────────────────

    public static ApiResult listEngagementSignals() {
        return doCallout('GET', '/engagement-signals?dataspaceName=default&limit=50', null);
    }

    public static ApiResult createEngagementSignal(String bodyJson) {
        return doCallout('POST', '/engagement-signals', bodyJson);
    }

    public static ApiResult deleteEngagementSignal(String signalId) {
        return doCallout('DELETE', '/engagement-signals/' + signalId, null);
    }

    public static ApiResult createSignalMetric(String signalId, String bodyJson) {
        return doCallout('POST', '/engagement-signals/' + signalId + '/metrics', bodyJson);
    }

    // ─── Compound Metrics ───────────────────────────────────────────────────

    public static ApiResult listCompoundMetrics() {
        return doCallout('GET', '/compound-metrics', null);
    }

    public static ApiResult createCompoundMetric(String bodyJson) {
        return doCallout('POST', '/compound-metrics', bodyJson);
    }

    public static ApiResult deleteCompoundMetric(String metricId) {
        return doCallout('DELETE', '/compound-metrics/' + metricId, null);
    }

    // ─── Recommenders ───────────────────────────────────────────────────────

    public static ApiResult listRecommenders() {
        return doCallout('GET', '/personalization-recommenders', null);
    }

    public static ApiResult getRecommender(String nameOrId) {
        return doCallout('GET', '/personalization-recommenders/' + nameOrId, null);
    }

    public static ApiResult createRecommender(String bodyJson) {
        return doCallout('POST', '/personalization-recommenders', bodyJson);
    }

    public static ApiResult updateRecommender(String nameOrId, String bodyJson) {
        return doCallout('PATCH', '/personalization-recommenders/' + nameOrId, bodyJson);
    }

    public static ApiResult deleteRecommender(String nameOrId) {
        return doCallout('DELETE', '/personalization-recommenders/' + nameOrId, null);
    }

    // ─── Experiments ────────────────────────────────────────────────────────

    public static ApiResult createExperiment(String bodyJson) {
        return doCallout('POST', '/abn-experiments', bodyJson);
    }

    public static ApiResult getExperiment(String nameOrId) {
        return doCallout('GET', '/abn-experiments/' + nameOrId, null);
    }

    public static ApiResult updateExperiment(String nameOrId, String action, String bodyJson) {
        String path = '/abn-experiments/' + nameOrId;
        if (String.isNotBlank(action)) path += '?action=' + action;
        return doCallout('PATCH', path, String.isNotBlank(bodyJson) ? bodyJson : '{}');
    }

    public static ApiResult deleteExperiment(String nameOrId) {
        return doCallout('DELETE', '/abn-experiments/' + nameOrId, null);
    }
}
