/**
 * Invocable wrapper for CampaignFlowBuilderService.scheduleCampaigns().
 * Separated because Apex allows only one @InvocableMethod per class.
 */
public with sharing class ScheduleCampaignActivation {
    @InvocableMethod(label='Schedule Campaign Activation' description='Activates or deactivates all personalization variations for a campaign ID. Use action="activate" or action="deactivate".')
    public static List<CampaignFlowBuilderService.ScheduleResponse> invoke(List<CampaignFlowBuilderService.ScheduleRequest> requests) {
        return CampaignFlowBuilderService.scheduleCampaigns(requests);
    }
}
