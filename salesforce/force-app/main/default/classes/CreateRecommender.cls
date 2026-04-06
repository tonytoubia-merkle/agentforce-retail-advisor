public with sharing class CreateRecommender {
    @InvocableMethod(label='Create Personalization Recommender' description='Creates a new AI recommender in SF Personalization. Provide name, label, objective, and data graph names.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.RecommenderRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.RecommenderRequest req = requests[0];
        Map<String, Object> body = new Map<String, Object>{
            'name' => req.name,
            'label' => req.label,
            'dataSpaceName' => String.isNotBlank(req.dataSpaceName) ? req.dataSpaceName : 'default',
            'objectiveName' => String.isNotBlank(req.objectiveName) ? req.objectiveName : 'Max_Clicks',
            'profileDataGraphName' => String.isNotBlank(req.profileDataGraphName) ? req.profileDataGraphName : 'IndividualsCustomerEngmt',
            'itemDataGraphName' => String.isNotBlank(req.itemDataGraphName) ? req.itemDataGraphName : 'Personalization_Product'
        };
        PersonalizationApiService.ApiResult result = PersonalizationApiService.createRecommender(JSON.serialize(body));
        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        resp.summary = result.success ? 'Recommender "' + req.name + '" created.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
