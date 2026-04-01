/**
 * Lightweight Apex controller for the Campaign Planner LWC page.
 * Returns active variations and campaign journey approvals for the results panel.
 */
public with sharing class CampaignPlannerPageController {

    @AuraEnabled(cacheable=false)
    public static List<Personalization_Variation__c> getActiveVariations() {
        return [
            SELECT Id, Name, Variation_Name__c, Point_Name__c, Segment_Rules__c,
                   Priority__c, Is_Active__c, Channel__c, Start_Date__c, End_Date__c,
                   Created_By_API__c, CreatedDate
            FROM Personalization_Variation__c
            WHERE Created_By_API__c = true
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
    }

    @AuraEnabled(cacheable=false)
    public static List<Journey_Approval__c> getCampaignJourneys() {
        return [
            SELECT Id, Journey_Id__c, Step_Number__c, Total_Steps__c, Channel__c,
                   Send_Delay_Days__c, Suggested_Subject__c, Status__c,
                   Event_Type__c, Event_Summary__c, Confidence_Score__c,
                   CreatedDate
            FROM Journey_Approval__c
            WHERE Event_Type__c IN ('campaign-planned', 'winback-promotion')
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
    }
}
