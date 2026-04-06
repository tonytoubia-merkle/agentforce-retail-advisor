public with sharing class CreateExperiment {
    @InvocableMethod(label='Create A/B Experiment' description='Creates a new A/B experiment in SF Personalization. Pass the full experiment configuration as JSON including cohorts, metrics, and duration settings.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.ExperimentRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.ExperimentRequest req = requests[0];
        PersonalizationApiService.ApiResult result = PersonalizationApiService.createExperiment(req.configJson);
        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        if (result.success) {
            try {
                Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(result.responseJson);
                resp.summary = 'Experiment "' + parsed.get('name') + '" created (state: ' + parsed.get('state') + '). Use ManageExperiment with action=start to begin.';
            } catch (Exception e) {
                resp.summary = 'Experiment created.';
            }
        } else {
            resp.summary = 'Failed: ' + result.errorMessage;
        }
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
