/**
 * SceneAssetService - Intelligent scene registry lookup.
 * Searches Scene_Asset__c for the best matching background given a setting,
 * mood, customer context, and scene type. Returns "reuse", "edit", or "generate".
 */
public with sharing class SceneAssetService {

    public class SceneSearchRequest {
        @InvocableVariable(required=true)
        public String setting;

        @InvocableVariable
        public String mood;

        @InvocableVariable
        public String productIds;        // semicolon-separated

        @InvocableVariable
        public String customerContext;   // semicolon-separated tags e.g. "known-customer;travel-return"

        @InvocableVariable
        public String sceneType;         // "product", "welcome", "ambient"
    }

    public class SceneSearchResult {
        @InvocableVariable
        public String sceneAssetId;

        @InvocableVariable
        public String imageUrl;

        @InvocableVariable
        public String action;            // "reuse", "edit", "generate"

        @InvocableVariable
        public String editBaseImageUrl;

        @InvocableVariable
        public String suggestedPrompt;
    }

    @InvocableMethod(label='Find Best Scene' description='Searches scene registry for best matching background')
    public static List<SceneSearchResult> findBestScene(List<SceneSearchRequest> requests) {
        List<SceneSearchResult> results = new List<SceneSearchResult>();

        for (SceneSearchRequest req : requests) {
            results.add(processRequest(req));
        }

        return results;
    }

    private static SceneSearchResult processRequest(SceneSearchRequest req) {
        SceneSearchResult result = new SceneSearchResult();

        // Query candidates matching the setting
        String sceneType = String.isNotBlank(req.sceneType) ? req.sceneType : 'product';
        List<Scene_Asset__c> candidates = [
            SELECT Id, Setting__c, Mood__c, Products_Used__c, Customer_Context__c,
                   Image_URL__c, Content_Version_Id__c, Quality_Score__c, Usage_Count__c,
                   Last_Used__c, Is_Edited__c, Generation_Prompt__c, Scene_Type__c
            FROM Scene_Asset__c
            WHERE Setting__c = :req.setting
              AND Scene_Type__c = :sceneType
              AND Quality_Score__c >= 2.0
            ORDER BY Quality_Score__c DESC, Last_Used__c DESC NULLS LAST
            LIMIT 10
        ];

        if (candidates.isEmpty()) {
            result.action = 'generate';
            result.suggestedPrompt = buildGenerationPrompt(req);
            return result;
        }

        // Score each candidate
        Scene_Asset__c bestMatch = null;
        Decimal bestScore = 0;

        Set<String> reqProducts = new Set<String>();
        if (String.isNotBlank(req.productIds)) {
            reqProducts.addAll(req.productIds.split(';'));
        }

        Set<String> reqContextTags = new Set<String>();
        if (String.isNotBlank(req.customerContext)) {
            reqContextTags.addAll(req.customerContext.split(';'));
        }

        for (Scene_Asset__c candidate : candidates) {
            Decimal score = 0;

            // Exact mood match
            if (String.isNotBlank(req.mood) && req.mood.equalsIgnoreCase(candidate.Mood__c)) {
                score += 3;
            } else if (String.isBlank(req.mood) && String.isBlank(candidate.Mood__c)) {
                score += 2;
            }

            // Customer context overlap
            if (String.isNotBlank(candidate.Customer_Context__c)) {
                for (String tag : candidate.Customer_Context__c.split(';')) {
                    if (reqContextTags.contains(tag.trim())) {
                        score += 2;
                    }
                }
            }

            // Product overlap
            if (String.isNotBlank(candidate.Products_Used__c)) {
                for (String pid : candidate.Products_Used__c.split(';')) {
                    if (reqProducts.contains(pid.trim())) {
                        score += 1;
                    }
                }
            }

            // Quality bonus
            if (candidate.Quality_Score__c != null) {
                score += candidate.Quality_Score__c;
            }

            // Recency bonus
            if (candidate.Last_Used__c != null && candidate.Last_Used__c >= Datetime.now().addDays(-7)) {
                score += 1;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        // Decision thresholds
        if (bestScore >= 5 && String.isNotBlank(bestMatch.Image_URL__c)) {
            result.action = 'reuse';
            result.sceneAssetId = bestMatch.Id;
            result.imageUrl = bestMatch.Image_URL__c;

            // Update usage stats (fire-and-forget DML)
            bestMatch.Usage_Count__c = (bestMatch.Usage_Count__c != null ? bestMatch.Usage_Count__c : 0) + 1;
            bestMatch.Last_Used__c = Datetime.now();
            update bestMatch;
        } else if (bestScore >= 3 && String.isNotBlank(bestMatch.Image_URL__c)) {
            result.action = 'edit';
            result.sceneAssetId = bestMatch.Id;
            result.editBaseImageUrl = bestMatch.Image_URL__c;
            result.suggestedPrompt = buildEditPrompt(req, bestMatch);
        } else {
            result.action = 'generate';
            result.suggestedPrompt = buildGenerationPrompt(req);
        }

        return result;
    }

    private static String buildGenerationPrompt(SceneSearchRequest req) {
        String prompt = 'Luxury beauty product scene, ' + req.setting + ' setting';
        if (String.isNotBlank(req.mood)) {
            prompt += ', ' + req.mood + ' mood';
        }
        prompt += ', elegant lighting, high-end retail photography style';
        return prompt;
    }

    private static String buildEditPrompt(SceneSearchRequest req, Scene_Asset__c base) {
        String prompt = 'Modify this ' + req.setting + ' scene';
        if (String.isNotBlank(req.mood)) {
            prompt += ' to have a ' + req.mood + ' atmosphere';
        }
        prompt += ', maintain luxury beauty aesthetic';
        return prompt;
    }
}
