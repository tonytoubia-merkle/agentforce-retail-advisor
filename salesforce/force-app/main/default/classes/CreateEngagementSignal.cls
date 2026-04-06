public with sharing class CreateEngagementSignal {
    @InvocableMethod(label='Create Engagement Signal' description='Creates a new engagement signal in SF Personalization. Pass the full signal configuration as JSON.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.SignalRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.SignalRequest req = requests[0];
        PersonalizationApiService.ApiResult result = PersonalizationApiService.createEngagementSignal(req.configJson);
        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        resp.summary = result.success ? 'Engagement signal created successfully.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
