public with sharing class ManageExperiment {
    @InvocableMethod(label='Manage A/B Experiment' description='Start, stop, archive, delete, or check status of an A/B experiment. Set action to: start, stop, archive, delete, or status.')
    public static List<PersonalizationApiService.ApiResponse> invoke(List<PersonalizationApiService.ExperimentRequest> requests) {
        PersonalizationApiService.ApiResponse resp = new PersonalizationApiService.ApiResponse();
        if (requests.isEmpty()) { resp.success = false; resp.errorMessage = 'No request'; return new List<PersonalizationApiService.ApiResponse>{ resp }; }
        PersonalizationApiService.ExperimentRequest req = requests[0];
        PersonalizationApiService.ApiResult result;

        if (req.action == 'status') {
            result = PersonalizationApiService.getExperiment(req.nameOrId);
            if (result.success) {
                try {
                    Map<String, Object> exp = (Map<String, Object>) JSON.deserializeUntyped(result.responseJson);
                    resp.summary = 'Experiment "' + exp.get('name') + '": state=' + exp.get('state') + ', status=' + exp.get('status')
                        + ', cohorts=' + ((List<Object>) exp.get('cohorts')).size();
                } catch (Exception e) {
                    resp.summary = 'Experiment retrieved.';
                }
            }
        } else if (req.action == 'delete') {
            result = PersonalizationApiService.deleteExperiment(req.nameOrId);
            resp.summary = result.success ? 'Experiment deleted.' : 'Failed: ' + result.errorMessage;
        } else {
            // start, stop, archive
            result = PersonalizationApiService.updateExperiment(req.nameOrId, req.action, req.configJson);
            resp.summary = result.success ? 'Experiment action "' + req.action + '" completed.' : 'Failed: ' + result.errorMessage;
        }

        resp.success = result.success;
        resp.responseJson = result.responseJson;
        resp.errorMessage = result.errorMessage;
        if (String.isBlank(resp.summary)) resp.summary = result.success ? 'Done.' : 'Failed: ' + result.errorMessage;
        return new List<PersonalizationApiService.ApiResponse>{ resp };
    }
}
