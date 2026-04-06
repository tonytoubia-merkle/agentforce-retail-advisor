public with sharing class ListEngagementSignals {
    @InvocableMethod(label='List Engagement Signals' description='Lists all engagement signals configured in SF Personalization. Returns JSON with signal names, labels, DMOs, and metrics.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.SignalRequest> requests) {
        PersonalizationApiService.ApiResult result = PersonalizationApiService.listEngagementSignals();
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        resp.summary = result.success ? 'Retrieved engagement signals list.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
