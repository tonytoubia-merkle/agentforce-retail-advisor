public with sharing class ListRecommenders {
    @InvocableMethod(label='List Personalization Recommenders' description='Lists all recommenders configured in SF Personalization with their status, objective, and data graphs.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.SignalRequest> requests) {
        PersonalizationApiService.ApiResult result = PersonalizationApiService.listRecommenders();
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        resp.summary = result.success ? 'Retrieved recommenders list.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
