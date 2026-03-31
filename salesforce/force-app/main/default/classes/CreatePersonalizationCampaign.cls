/**
 * Invocable wrapper for CampaignPlannerService.createCampaigns().
 * Separated because Apex allows only one @InvocableMethod per class.
 */
public with sharing class CreatePersonalizationCampaign {
    @InvocableMethod(label='Create Personalization Campaign' description='Creates personalized hero banner + exit intent variations and optional sequenced email/SMS flow. Returns variation IDs and flow ID.')
    public static List<CampaignPlannerService.CreateCampaignResponse> invoke(List<CampaignPlannerService.CreateCampaignRequest> requests) {
        return CampaignPlannerService.createCampaigns(requests);
    }
}
