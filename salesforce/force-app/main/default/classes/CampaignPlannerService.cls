/**
 * CampaignPlannerService — AI-driven campaign planning that combines
 * MarketingIntelligenceService insights with programmatic personalization
 * variation creation and sequenced flow generation.
 *
 * Capabilities:
 *   1. Analyze traffic/engagement trends (delegates to MarketingIntelligenceService)
 *   2. Recommend campaign strategies based on data patterns
 *   3. Create Personalization_Variation__c records (hero banners, exit intents)
 *   4. Generate sequenced email/SMS flows via CampaignFlowBuilderService
 *   5. Schedule campaign start/end dates on variations
 *
 * Designed as Agentforce agent actions — each method is @InvocableMethod
 * so the Campaign Planner agent can chain: analyze → recommend → create → activate.
 */
public with sharing class CampaignPlannerService {

    // ─── Campaign Plan Result ───────────────────────────────────────────────

    public class CampaignPlan {
        @AuraEnabled public String planId;
        @AuraEnabled public String planName;
        @AuraEnabled public String rationale;
        @AuraEnabled public String targetSegment;
        @AuraEnabled public Map<String, Object> segmentRules;
        @AuraEnabled public List<String> heroContent;
        @AuraEnabled public List<String> emailSteps;
        @AuraEnabled public List<String> channels;
        @AuraEnabled public Integer durationDays;
        @AuraEnabled public String status;
    }

    // ─── 1. Analyze & Recommend (Invocable) ─────────────────────────────────

    public class AnalyzeRequest {
        @InvocableVariable(label='Lookback Days' description='Analysis window (default: 7)')
        public Integer lookbackDays;
        @InvocableVariable(label='Focus Source' description='Optional: focus on specific traffic source (e.g., tiktok, instagram)')
        public String focusSource;
        @InvocableVariable(label='Focus Category' description='Optional: focus on specific product category')
        public String focusCategory;
    }

    public class AnalyzeResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String intelligenceReport;
        @InvocableVariable public String recommendations;
        @InvocableVariable public String errorMessage;
    }

    @InvocableMethod(label='Analyze Marketing Trends' description='Analyzes browse and engagement data to identify campaign opportunities. Returns intelligence report with traffic trends, category affinity, and segment patterns.')
    public static List<AnalyzeResponse> analyzeTrends(List<AnalyzeRequest> requests) {
        List<AnalyzeResponse> responses = new List<AnalyzeResponse>();
        for (AnalyzeRequest req : requests) {
            AnalyzeResponse resp = new AnalyzeResponse();
            try {
                Integer days = req.lookbackDays != null ? req.lookbackDays : 7;
                MarketingIntelligenceService.IntelligenceReport report =
                    MarketingIntelligenceService.generateReport(days, req.focusSource, req.focusCategory);

                resp.success = true;
                resp.intelligenceReport = report.summary;
                resp.recommendations = buildRecommendations(report);
            } catch (Exception e) {
                resp.success = false;
                resp.errorMessage = e.getMessage();
            }
            responses.add(resp);
        }
        return responses;
    }

    // ─── 2. Create Campaign (Invocable) ─────────────────────────────────────

    public class CreateCampaignRequest {
        @InvocableVariable(label='Campaign Name' required=true description='Human-readable campaign name')
        public String campaignName;

        @InvocableVariable(label='Hero Headline' required=true description='Main headline for the hero banner (use \\n for line break)')
        public String heroHeadline;

        @InvocableVariable(label='Hero Body' description='Supporting copy for the hero banner')
        public String heroBody;

        @InvocableVariable(label='Hero Badge' description='Badge text (e.g., "TikTok Exclusive", "VIP Only")')
        public String heroBadge;

        @InvocableVariable(label='Hero CTA' description='Call-to-action text (default: "Shop Now")')
        public String heroCta;

        @InvocableVariable(label='Segment Rules JSON' required=true description='JSON targeting rules. E.g., {"utm_source":"tiktok"} or {"identity_tier":"known","utm_source":"tiktok"}')
        public String segmentRulesJson;

        @InvocableVariable(label='Priority' description='Variation priority (higher wins). Use 50-99 for source-level, 100-199 for campaign-level, 200+ for targeted.')
        public Integer priority;

        @InvocableVariable(label='Duration Days' description='How many days the campaign runs (default: 7)')
        public Integer durationDays;

        @InvocableVariable(label='Exclude When Campaign Match' description='If true, this variation will NOT fire when a more specific utm_campaign rule already matched (default: true)')
        public Boolean excludeWhenCampaignMatch;

        @InvocableVariable(label='Create Exit Intent' description='Also create an Exit_Intent_Capture variation (default: true)')
        public Boolean createExitIntent;

        @InvocableVariable(label='Exit Intent Headline' description='Exit intent headline (auto-generated if blank)')
        public String exitHeadline;

        @InvocableVariable(label='Exit Intent Discount Code' description='Optional discount code for exit intent')
        public String exitDiscountCode;

        @InvocableVariable(label='Exit Intent Discount Percent' description='Optional discount percentage')
        public Integer exitDiscountPercent;

        @InvocableVariable(label='VIP Variation Headline' description='If set, creates an additional higher-priority variation for VIP/high-CLV segment')
        public String vipHeadline;

        @InvocableVariable(label='VIP Variation Body' description='Supporting copy for VIP variation')
        public String vipBody;

        @InvocableVariable(label='Email Subject 1' description='Subject line for first email in sequence')
        public String emailSubject1;

        @InvocableVariable(label='Email Body 1' description='Body for first email')
        public String emailBody1;

        @InvocableVariable(label='Email Subject 2' description='Subject for follow-up email (sent after delay)')
        public String emailSubject2;

        @InvocableVariable(label='Email Body 2' description='Body for follow-up email')
        public String emailBody2;

        @InvocableVariable(label='SMS Body' description='Optional SMS message (requires opt-in)')
        public String smsBody;
    }

    public class CreateCampaignResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String campaignPlanJson;
        @InvocableVariable public String heroVariationId;
        @InvocableVariable public String exitVariationId;
        @InvocableVariable public String vipVariationId;
        @InvocableVariable public String flowId;
        @InvocableVariable public String summary;
        @InvocableVariable public String errorMessage;
    }

    public static List<CreateCampaignResponse> createCampaigns(List<CreateCampaignRequest> requests) {
        List<CreateCampaignResponse> responses = new List<CreateCampaignResponse>();
        for (CreateCampaignRequest req : requests) {
            responses.add(executeCampaignCreation(req));
        }
        return responses;
    }

    private static CreateCampaignResponse executeCampaignCreation(CreateCampaignRequest req) {
        CreateCampaignResponse resp = new CreateCampaignResponse();
        List<String> summaryParts = new List<String>();

        try {
            // Parse segment rules
            Map<String, Object> segmentRules = String.isNotBlank(req.segmentRulesJson)
                ? (Map<String, Object>) JSON.deserializeUntyped(req.segmentRulesJson)
                : new Map<String, Object>();

            Integer priority = req.priority != null ? req.priority : 100;
            Integer durationDays = req.durationDays != null ? req.durationDays : 7;
            Datetime startDate = Datetime.now();
            Datetime endDate = Datetime.now().addDays(durationDays);
            String campaignId = 'CMP-' + String.valueOf(Datetime.now().getTime()).right(8);

            List<Personalization_Variation__c> variations = new List<Personalization_Variation__c>();

            // ── Hero Banner Variation ────────────────────────────────────────

            Map<String, Object> heroContent = new Map<String, Object>{
                'badge' => String.isNotBlank(req.heroBadge) ? req.heroBadge : 'New',
                'header_text' => req.heroHeadline,
                'body_text' => String.isNotBlank(req.heroBody) ? req.heroBody : '',
                'cta' => String.isNotBlank(req.heroCta) ? req.heroCta : 'Shop Now',
                'campaign_id' => campaignId
            };

            Personalization_Variation__c heroVar = new Personalization_Variation__c(
                Point_Name__c = 'Hero_Banner',
                Variation_Name__c = req.campaignName + ' — Hero',
                Content_JSON__c = JSON.serialize(heroContent),
                Segment_Rules__c = JSON.serialize(segmentRules),
                Priority__c = priority,
                Is_Active__c = true,
                Channel__c = 'Web',
                Created_By_API__c = true,
                Start_Date__c = startDate,
                End_Date__c = endDate
            );
            variations.add(heroVar);
            summaryParts.add('Hero banner created targeting ' + JSON.serialize(segmentRules));

            // ── VIP Variation (higher priority, stricter rules) ─────────────

            if (String.isNotBlank(req.vipHeadline)) {
                Map<String, Object> vipRules = new Map<String, Object>(segmentRules);
                vipRules.put('identity_tier', 'known');

                Map<String, Object> vipContent = new Map<String, Object>{
                    'badge' => 'VIP Exclusive',
                    'header_text' => req.vipHeadline,
                    'body_text' => String.isNotBlank(req.vipBody) ? req.vipBody : req.heroBody,
                    'cta' => String.isNotBlank(req.heroCta) ? req.heroCta : 'Shop Now',
                    'campaign_id' => campaignId
                };

                Personalization_Variation__c vipVar = new Personalization_Variation__c(
                    Point_Name__c = 'Hero_Banner',
                    Variation_Name__c = req.campaignName + ' — VIP Hero',
                    Content_JSON__c = JSON.serialize(vipContent),
                    Segment_Rules__c = JSON.serialize(vipRules),
                    Priority__c = priority + 50, // VIP wins over general
                    Is_Active__c = true,
                    Channel__c = 'Web',
                    Created_By_API__c = true,
                    Start_Date__c = startDate,
                    End_Date__c = endDate
                );
                variations.add(vipVar);
                summaryParts.add('VIP variation created (priority +50) with identity_tier=known');
            }

            // ── Exit Intent Variation ────────────────────────────────────────

            Boolean createExit = req.createExitIntent == null || req.createExitIntent;
            if (createExit) {
                String exitHL = String.isNotBlank(req.exitHeadline)
                    ? req.exitHeadline
                    : 'Wait — don\'t leave yet!';

                Map<String, Object> exitContent = new Map<String, Object>{
                    'header_text' => exitHL,
                    'body_text' => 'Complete your journey and discover something perfect for you.',
                    'cta' => 'Stay & Explore',
                    'campaign_id' => campaignId
                };

                if (String.isNotBlank(req.exitDiscountCode)) {
                    exitContent.put('discount_code', req.exitDiscountCode);
                    exitContent.put('discount_value', String.valueOf(req.exitDiscountPercent != null ? req.exitDiscountPercent : 10));
                    exitContent.put('body_text', 'Use code ' + req.exitDiscountCode + ' for ' +
                        (req.exitDiscountPercent != null ? req.exitDiscountPercent : 10) + '% off your first order.');
                    exitContent.put('cta', 'Claim My Discount');
                }

                Personalization_Variation__c exitVar = new Personalization_Variation__c(
                    Point_Name__c = 'Exit_Intent_Capture',
                    Variation_Name__c = req.campaignName + ' — Exit Intent',
                    Content_JSON__c = JSON.serialize(exitContent),
                    Segment_Rules__c = JSON.serialize(segmentRules),
                    Priority__c = priority,
                    Is_Active__c = true,
                    Channel__c = 'Web',
                    Created_By_API__c = true,
                    Start_Date__c = startDate,
                    End_Date__c = endDate
                );
                variations.add(exitVar);
                summaryParts.add('Exit intent capture created' +
                    (String.isNotBlank(req.exitDiscountCode) ? ' with discount code ' + req.exitDiscountCode : ''));
            }

            // Insert all variations
            insert variations;

            // Map IDs back
            resp.heroVariationId = variations[0].Id;
            if (String.isNotBlank(req.vipHeadline) && variations.size() > 1) {
                resp.vipVariationId = variations[1].Id;
            }
            if (createExit) {
                resp.exitVariationId = variations[variations.size() - 1].Id;
            }

            // ── Sequenced Flow Creation ─────────────────────────────────────

            if (String.isNotBlank(req.emailSubject1)) {
                try {
                    CampaignFlowBuilderService.FlowRequest flowReq = new CampaignFlowBuilderService.FlowRequest();
                    flowReq.campaignName = req.campaignName;
                    flowReq.campaignId = campaignId;
                    flowReq.segmentRulesJson = req.segmentRulesJson;
                    flowReq.durationDays = durationDays;
                    flowReq.emailSubject1 = req.emailSubject1;
                    flowReq.emailBody1 = req.emailBody1;
                    flowReq.emailSubject2 = req.emailSubject2;
                    flowReq.emailBody2 = req.emailBody2;
                    flowReq.smsBody = req.smsBody;

                    List<CampaignFlowBuilderService.FlowResponse> flowResps =
                        CampaignFlowBuilderService.createCampaignFlows(
                            new List<CampaignFlowBuilderService.FlowRequest>{ flowReq }
                        );

                    if (!flowResps.isEmpty() && flowResps[0].success) {
                        resp.flowId = flowResps[0].flowId;
                        summaryParts.add('Sequenced flow created: ' + flowResps[0].summary);
                    } else if (!flowResps.isEmpty()) {
                        summaryParts.add('Flow creation note: ' + flowResps[0].errorMessage);
                    }
                } catch (Exception flowErr) {
                    summaryParts.add('Flow creation skipped: ' + flowErr.getMessage());
                }
            }

            resp.success = true;
            resp.summary = 'Campaign "' + req.campaignName + '" created.\n' + String.join(summaryParts, '\n');
            resp.campaignPlanJson = JSON.serialize(new Map<String, Object>{
                'campaignId' => campaignId,
                'name' => req.campaignName,
                'variations' => variations.size(),
                'heroId' => resp.heroVariationId,
                'vipId' => resp.vipVariationId,
                'exitId' => resp.exitVariationId,
                'flowId' => resp.flowId,
                'durationDays' => durationDays,
                'segmentRules' => segmentRules,
                'startDate' => String.valueOf(startDate),
                'endDate' => String.valueOf(endDate)
            });

        } catch (Exception e) {
            resp.success = false;
            resp.errorMessage = e.getMessage();
        }

        return resp;
    }

    // ─── Recommendation Builder ─────────────────────────────────────────────

    private static String buildRecommendations(MarketingIntelligenceService.IntelligenceReport report) {
        List<String> recs = new List<String>();

        // Spike-based recommendations
        for (MarketingIntelligenceService.TrafficTrend t : report.trafficTrends) {
            if (t.changePercent >= 30) {
                recs.add('OPPORTUNITY: ' + t.source + ' traffic spiked ' + t.changePercent +
                    '%. Consider a targeted hero banner for utm_source=' + t.source +
                    ' visitors focusing on: ' + String.join(t.topCategories, ', ') + '.');
            }
        }

        // Segment contrast recommendations
        if (report.segmentPatterns.size() >= 2) {
            MarketingIntelligenceService.SegmentProductPattern vip = report.segmentPatterns[0];
            MarketingIntelligenceService.SegmentProductPattern gen = report.segmentPatterns[1];

            // Products VIP is looking at but general isn't
            Set<String> vipOnly = new Set<String>(vip.products);
            vipOnly.removeAll(new Set<String>(gen.products));
            if (!vipOnly.isEmpty()) {
                recs.add('VIP INSIGHT: High-CLV customers are uniquely interested in: ' +
                    String.join(new List<String>(vipOnly), ', ') +
                    '. Consider a premium hero variation for known/VIP visitors.');
            }
        }

        // Category-based recommendations
        for (MarketingIntelligenceService.CategoryInsight ci : report.categoryInsights) {
            if (ci.viewCount >= 20 && ci.avgDurationMinutes >= 3) {
                recs.add('ENGAGEMENT: ' + ci.category + ' shows high engagement (' +
                    ci.viewCount + ' views, ' + ci.avgDurationMinutes + ' min avg). ' +
                    'Consider featuring top products: ' + String.join(ci.topProducts, ', ') + '.');
            }
        }

        if (recs.isEmpty()) {
            recs.add('No strong signals detected in this period. Consider increasing the lookback window or focusing on a specific source/category.');
        }

        return String.join(recs, '\n\n');
    }
}
