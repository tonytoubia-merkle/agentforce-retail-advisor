/**
 * Resolves the best Personalization_Variation__c for a given point + visitor context.
 *
 * Segment rules are stored as JSON on each variation record. The resolver evaluates
 * ALL rules against the visitor context — every key must match for the variation to
 * be eligible. Among eligible variations, the highest Priority__c wins.
 *
 * Rule syntax (Segment_Rules__c JSON):
 *   { "utm_source": "tiktok" }                    — exact string match
 *   { "identity_tier": "known" }                   — exact match
 *   { "interests": ["skincare", "anti-aging"] }    — array: at least one must appear in context
 *   { "utm_source": "tiktok", "identity_tier": "appended" }  — AND: both must match
 *   {} or null                                     — default (matches any visitor)
 *
 * Usage:
 *   Map<String, Object> ctx = new Map<String, Object>{
 *       'utm_source' => 'tiktok',
 *       'identity_tier' => 'known',
 *       'interests' => new List<String>{'skincare','makeup'}
 *   };
 *   PersonalizationVariationService.VariationResult result =
 *       PersonalizationVariationService.resolve('Hero_Banner', ctx, 'Web');
 */
public with sharing class PersonalizationVariationService {

    public class VariationResult {
        @AuraEnabled public Id variationId;
        @AuraEnabled public String pointName;
        @AuraEnabled public String variationName;
        @AuraEnabled public Map<String, Object> content;
        @AuraEnabled public Map<String, Object> segmentRules;
        @AuraEnabled public Integer priority;
    }

    /**
     * Resolve the best matching variation for a personalization point.
     *
     * @param pointName     e.g. "Hero_Banner", "Exit_Intent_Capture"
     * @param visitorCtx    key/value map of visitor attributes (utm_source, identity_tier, interests, etc.)
     * @param channel       "Web", "Mobile", "Email" — matched against Channel__c (null = any)
     * @return              the winning variation's content, or null if no match
     */
    public static VariationResult resolve(String pointName, Map<String, Object> visitorCtx, String channel) {
        DateTime now = DateTime.now();

        List<Personalization_Variation__c> candidates = [
            SELECT Id, Variation_Name__c, Segment_Rules__c, Content_JSON__c, Priority__c, Channel__c
            FROM Personalization_Variation__c
            WHERE Point_Name__c = :pointName
              AND Is_Active__c = true
              AND (Start_Date__c = null OR Start_Date__c <= :now)
              AND (End_Date__c = null OR End_Date__c >= :now)
            ORDER BY Priority__c DESC
        ];

        for (Personalization_Variation__c v : candidates) {
            // Channel filter
            if (channel != null && v.Channel__c != null && v.Channel__c != 'All' && v.Channel__c != channel) {
                continue;
            }

            // Parse segment rules
            Map<String, Object> rules;
            if (String.isBlank(v.Segment_Rules__c)) {
                rules = new Map<String, Object>();
            } else {
                rules = (Map<String, Object>) JSON.deserializeUntyped(v.Segment_Rules__c);
            }

            // Evaluate: every rule must match
            if (matchesAll(rules, visitorCtx)) {
                VariationResult result = new VariationResult();
                result.variationId = v.Id;
                result.pointName = pointName;
                result.variationName = v.Variation_Name__c;
                result.content = (Map<String, Object>) JSON.deserializeUntyped(v.Content_JSON__c);
                result.segmentRules = rules;
                result.priority = Integer.valueOf(v.Priority__c);
                return result;
            }
        }

        return null;
    }

    /**
     * Check if all rules match the visitor context.
     * - String rule: exact match (case-insensitive)
     * - List rule: at least one element must be in the context's list for that key
     * - Empty rules: always match (default/fallback variation)
     */
    private static Boolean matchesAll(Map<String, Object> rules, Map<String, Object> ctx) {
        if (rules == null || rules.isEmpty()) return true;
        if (ctx == null) return false;

        for (String key : rules.keySet()) {
            Object ruleVal = rules.get(key);
            Object ctxVal = ctx.get(key);
            if (ctxVal == null) return false;

            if (ruleVal instanceof List<Object>) {
                // Array rule: at least one must match in context
                List<Object> ruleList = (List<Object>) ruleVal;
                if (ctxVal instanceof List<Object>) {
                    Set<String> ctxSet = new Set<String>();
                    for (Object o : (List<Object>) ctxVal) ctxSet.add(String.valueOf(o).toLowerCase());
                    Boolean found = false;
                    for (Object r : ruleList) {
                        if (ctxSet.contains(String.valueOf(r).toLowerCase())) { found = true; break; }
                    }
                    if (!found) return false;
                } else {
                    // Context is a single string, check if it's in the rule list
                    String ctxStr = String.valueOf(ctxVal).toLowerCase();
                    Boolean found = false;
                    for (Object r : ruleList) {
                        if (String.valueOf(r).toLowerCase() == ctxStr) { found = true; break; }
                    }
                    if (!found) return false;
                }
            } else {
                // String rule: exact match (case-insensitive)
                if (String.valueOf(ruleVal).toLowerCase() != String.valueOf(ctxVal).toLowerCase()) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * List all variations for a personalization point (for admin UIs).
     */
    public static List<Personalization_Variation__c> listVariations(String pointName) {
        return [
            SELECT Id, Name, Variation_Name__c, Point_Name__c, Segment_Rules__c,
                   Content_JSON__c, Priority__c, Is_Active__c, Channel__c,
                   Start_Date__c, End_Date__c, Created_By_API__c, CreatedDate
            FROM Personalization_Variation__c
            WHERE Point_Name__c = :pointName
            ORDER BY Priority__c DESC, CreatedDate DESC
        ];
    }
}
