public with sharing class ManageCompoundMetrics {
    @InvocableMethod(label='Manage Compound Metrics' description='List, create, or delete compound metrics. Set action to: list, create, or delete.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.CompoundMetricRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.CompoundMetricRequest req = requests[0];
        PersonalizationApiService.ApiResult result;

        if (req.action == 'list') {
            result = PersonalizationApiService.listCompoundMetrics();
            resp.summary = result.success ? 'Retrieved compound metrics.' : 'Failed: ' + result.errorMessage;
        } else if (req.action == 'create') {
            result = PersonalizationApiService.createCompoundMetric(req.configJson);
            resp.summary = result.success ? 'Compound metric created.' : 'Failed: ' + result.errorMessage;
        } else if (req.action == 'delete') {
            result = PersonalizationApiService.deleteCompoundMetric(req.metricId);
            resp.summary = result.success ? 'Compound metric deleted.' : 'Failed: ' + result.errorMessage;
        } else {
            result = new PersonalizationApiService.ApiResult();
            result.success = false;
            result.errorMessage = 'Unknown action: ' + req.action + '. Use list, create, or delete.';
            resp.summary = result.errorMessage;
        }

        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
