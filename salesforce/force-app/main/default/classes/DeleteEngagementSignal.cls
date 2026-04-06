public with sharing class DeleteEngagementSignal {
    @InvocableMethod(label='Delete Engagement Signal' description='Deletes an engagement signal by ID.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.SignalRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.ApiResult result = PersonalizationApiService.deleteEngagementSignal(requests[0].signalId);
        resp.success = result.success;
        resp.errorMessage = result.errorMessage;
        resp.summary = result.success ? 'Signal deleted.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
