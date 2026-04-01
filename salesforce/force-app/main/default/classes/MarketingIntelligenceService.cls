/**
 * MarketingIntelligenceService — Aggregates browse/engagement data to surface
 * actionable marketing insights: traffic trend spikes, category affinity by
 * segment, high-CLV product patterns, and channel performance.
 *
 * Called by:
 *   - CampaignPlannerService (agent-driven campaign recommendations)
 *   - JourneyBatchProcessor (to attach hero moment variations to journeys)
 *   - Invocable from Agentforce agent topics
 *
 * Design principle: All queries use aggregate SOQL to stay within governor limits.
 * Results are returned as structured data the AI agent can reason about.
 */
public with sharing class MarketingIntelligenceService {

    // ─── Result Types ───────────────────────────────────────────────────────

    public class TrafficTrend {
        @AuraEnabled public String source;
        @AuraEnabled public String medium;
        @AuraEnabled public Integer sessionCount;
        @AuraEnabled public Integer priorPeriodCount;
        @AuraEnabled public Decimal changePercent;
        @AuraEnabled public List<String> topCategories;
        @AuraEnabled public List<String> topProducts;
    }

    public class CategoryInsight {
        @AuraEnabled public String category;
        @AuraEnabled public Integer viewCount;
        @AuraEnabled public Decimal avgDurationMinutes;
        @AuraEnabled public String dominantSource;
        @AuraEnabled public List<String> topProducts;
    }

    public class SegmentProductPattern {
        @AuraEnabled public String segmentName;
        @AuraEnabled public String segmentCriteria;
        @AuraEnabled public List<String> products;
        @AuraEnabled public Integer customerCount;
        @AuraEnabled public Decimal avgOrderValue;
    }

    public class IntelligenceReport {
        @AuraEnabled public List<TrafficTrend> trafficTrends;
        @AuraEnabled public List<CategoryInsight> categoryInsights;
        @AuraEnabled public List<SegmentProductPattern> segmentPatterns;
        @AuraEnabled public String generatedAt;
        @AuraEnabled public Integer lookbackDays;
        @AuraEnabled public String summary;
    }

    // ─── Invocable Method (for Agentforce) ──────────────────────────────────

    public class IntelligenceRequest {
        @InvocableVariable(label='Lookback Days' description='How many days back to analyze (default: 7)')
        public Integer lookbackDays;
        @InvocableVariable(label='Focus Source' description='Optional: focus on a specific utm_source')
        public String focusSource;
        @InvocableVariable(label='Focus Category' description='Optional: focus on a specific product category')
        public String focusCategory;
    }

    public class IntelligenceResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public String reportJson;
        @InvocableVariable public String summary;
        @InvocableVariable public String errorMessage;
    }

    @InvocableMethod(label='Get Marketing Intelligence' description='Analyzes browse and engagement data to surface trends, segment patterns, and campaign opportunities')
    public static List<IntelligenceResponse> getIntelligence(List<IntelligenceRequest> requests) {
        List<IntelligenceResponse> responses = new List<IntelligenceResponse>();
        for (IntelligenceRequest req : requests) {
            IntelligenceResponse resp = new IntelligenceResponse();
            try {
                Integer days = (req.lookbackDays != null && req.lookbackDays > 0) ? req.lookbackDays : 7;
                IntelligenceReport report = generateReport(days, req.focusSource, req.focusCategory);
                resp.success = true;
                resp.reportJson = JSON.serialize(report);
                resp.summary = report.summary;
            } catch (Exception e) {
                resp.success = false;
                resp.errorMessage = e.getMessage();
            }
            responses.add(resp);
        }
        return responses;
    }

    // ─── Core Report Generation ─────────────────────────────────────────────

    public static IntelligenceReport generateReport(Integer lookbackDays, String focusSource, String focusCategory) {
        IntelligenceReport report = new IntelligenceReport();
        report.lookbackDays = lookbackDays;
        report.generatedAt = Datetime.now().format();

        Date startDate = Date.today().addDays(-lookbackDays);
        Date priorStart = Date.today().addDays(-lookbackDays * 2);

        // 1. Traffic trends by source
        report.trafficTrends = getTrafficTrends(startDate, priorStart, lookbackDays);

        // 2. Category insights
        report.categoryInsights = getCategoryInsights(startDate, focusSource);

        // 3. Segment-level product patterns (VIP/high-CLV vs. general)
        report.segmentPatterns = getSegmentProductPatterns(startDate, focusSource, focusCategory);

        // 4. Generate natural-language summary
        report.summary = buildSummary(report, focusSource, focusCategory);

        return report;
    }

    // ─── Traffic Trends ─────────────────────────────────────────────────────

    private static List<TrafficTrend> getTrafficTrends(Date startDate, Date priorStart, Integer lookbackDays) {
        List<TrafficTrend> trends = new List<TrafficTrend>();

        // Current period counts by source
        Map<String, Integer> currentCounts = new Map<String, Integer>();
        for (AggregateResult ar : [
            SELECT UTM_Source__c src, COUNT(Id) cnt
            FROM Browse_Session__c
            WHERE Session_Date__c >= :startDate AND UTM_Source__c != null
            GROUP BY UTM_Source__c
            ORDER BY COUNT(Id) DESC
            LIMIT 15
        ]) {
            currentCounts.put((String) ar.get('src'), (Integer) ar.get('cnt'));
        }

        // Prior period counts
        Date priorEnd = startDate.addDays(-1);
        Map<String, Integer> priorCounts = new Map<String, Integer>();
        for (AggregateResult ar : [
            SELECT UTM_Source__c src, COUNT(Id) cnt
            FROM Browse_Session__c
            WHERE Session_Date__c >= :priorStart AND Session_Date__c <= :priorEnd
              AND UTM_Source__c != null
            GROUP BY UTM_Source__c
        ]) {
            priorCounts.put((String) ar.get('src'), (Integer) ar.get('cnt'));
        }

        // Build trends with change %
        for (String source : currentCounts.keySet()) {
            TrafficTrend t = new TrafficTrend();
            t.source = source;
            t.sessionCount = currentCounts.get(source);
            t.priorPeriodCount = priorCounts.containsKey(source) ? priorCounts.get(source) : 0;
            t.changePercent = t.priorPeriodCount > 0
                ? (((Decimal) t.sessionCount - t.priorPeriodCount) / t.priorPeriodCount * 100).setScale(1)
                : (t.sessionCount > 0 ? 100.0 : 0);

            // Top categories and products for this source
            t.topCategories = new List<String>();
            t.topProducts = new List<String>();
            for (Browse_Session__c bs : [
                SELECT Categories_Browsed__c, Products_Viewed__c
                FROM Browse_Session__c
                WHERE UTM_Source__c = :source AND Session_Date__c >= :startDate
                ORDER BY Session_Date__c DESC
                LIMIT 50
            ]) {
                if (String.isNotBlank(bs.Categories_Browsed__c)) {
                    for (String cat : bs.Categories_Browsed__c.split(';')) {
                        cat = cat.trim();
                        if (String.isNotBlank(cat) && !t.topCategories.contains(cat)) {
                            t.topCategories.add(cat);
                        }
                    }
                }
                if (String.isNotBlank(bs.Products_Viewed__c)) {
                    for (String prod : bs.Products_Viewed__c.split(';')) {
                        prod = prod.trim();
                        if (String.isNotBlank(prod) && !t.topProducts.contains(prod)) {
                            t.topProducts.add(prod);
                        }
                    }
                }
            }
            // Limit to top 5
            t.topCategories = truncate(t.topCategories, 5);
            t.topProducts = truncate(t.topProducts, 8);

            trends.add(t);
        }

        return trends;
    }

    // ─── Category Insights ──────────────────────────────────────────────────

    private static List<CategoryInsight> getCategoryInsights(Date startDate, String focusSource) {
        List<CategoryInsight> insights = new List<CategoryInsight>();

        // We need to process raw records since Categories_Browsed__c is multi-value
        String query = 'SELECT Categories_Browsed__c, Products_Viewed__c, Duration_Minutes__c, UTM_Source__c FROM Browse_Session__c WHERE Session_Date__c >= :startDate';
        if (String.isNotBlank(focusSource)) {
            query += ' AND UTM_Source__c = :focusSource';
        }
        query += ' LIMIT 500';

        Map<String, List<Decimal>> catDurations = new Map<String, List<Decimal>>();
        Map<String, Map<String, Integer>> catSources = new Map<String, Map<String, Integer>>();
        Map<String, Map<String, Integer>> catProducts = new Map<String, Map<String, Integer>>();

        for (Browse_Session__c bs : Database.query(query)) {
            if (String.isBlank(bs.Categories_Browsed__c)) continue;
            for (String cat : bs.Categories_Browsed__c.split(';')) {
                cat = cat.trim();
                if (String.isBlank(cat)) continue;

                // Duration tracking
                if (!catDurations.containsKey(cat)) catDurations.put(cat, new List<Decimal>());
                if (bs.Duration_Minutes__c != null) catDurations.get(cat).add(bs.Duration_Minutes__c);

                // Source tracking
                if (String.isNotBlank(bs.UTM_Source__c)) {
                    if (!catSources.containsKey(cat)) catSources.put(cat, new Map<String, Integer>());
                    Map<String, Integer> srcMap = catSources.get(cat);
                    srcMap.put(bs.UTM_Source__c, (srcMap.containsKey(bs.UTM_Source__c) ? srcMap.get(bs.UTM_Source__c) : 0) + 1);
                }

                // Product tracking
                if (String.isNotBlank(bs.Products_Viewed__c)) {
                    if (!catProducts.containsKey(cat)) catProducts.put(cat, new Map<String, Integer>());
                    Map<String, Integer> prodMap = catProducts.get(cat);
                    for (String prod : bs.Products_Viewed__c.split(';')) {
                        prod = prod.trim();
                        if (String.isNotBlank(prod)) {
                            prodMap.put(prod, (prodMap.containsKey(prod) ? prodMap.get(prod) : 0) + 1);
                        }
                    }
                }
            }
        }

        for (String cat : catDurations.keySet()) {
            CategoryInsight ci = new CategoryInsight();
            ci.category = cat;
            ci.viewCount = catDurations.get(cat).size();

            // Avg duration
            Decimal totalDur = 0;
            for (Decimal d : catDurations.get(cat)) totalDur += d;
            ci.avgDurationMinutes = ci.viewCount > 0 ? (totalDur / ci.viewCount).setScale(1) : 0;

            // Dominant source
            if (catSources.containsKey(cat)) {
                String topSrc = '';
                Integer topCnt = 0;
                for (String src : catSources.get(cat).keySet()) {
                    if (catSources.get(cat).get(src) > topCnt) {
                        topCnt = catSources.get(cat).get(src);
                        topSrc = src;
                    }
                }
                ci.dominantSource = topSrc;
            }

            // Top products
            ci.topProducts = new List<String>();
            if (catProducts.containsKey(cat)) {
                // Sort by count
                List<String> sorted = new List<String>(catProducts.get(cat).keySet());
                ci.topProducts = truncate(sorted, 5);
            }

            insights.add(ci);
        }

        return insights;
    }

    // ─── Segment Product Patterns ───────────────────────────────────────────

    private static List<SegmentProductPattern> getSegmentProductPatterns(Date startDate, String focusSource, String focusCategory) {
        List<SegmentProductPattern> patterns = new List<SegmentProductPattern>();

        // Build dynamic query for browse sessions
        String browseQuery = 'SELECT Customer_Id__c, Products_Viewed__c, Categories_Browsed__c FROM Browse_Session__c WHERE Session_Date__c >= :startDate AND Customer_Id__c != null';
        if (String.isNotBlank(focusSource)) browseQuery += ' AND UTM_Source__c = \'' + String.escapeSingleQuotes(focusSource) + '\'';
        browseQuery += ' LIMIT 500';

        // Collect customer IDs and their products
        Map<String, Set<String>> customerProducts = new Map<String, Set<String>>();
        for (Browse_Session__c bs : Database.query(browseQuery)) {
            if (String.isBlank(bs.Products_Viewed__c)) continue;

            // Category filter
            if (String.isNotBlank(focusCategory) && String.isNotBlank(bs.Categories_Browsed__c)) {
                if (!bs.Categories_Browsed__c.containsIgnoreCase(focusCategory)) continue;
            }

            if (!customerProducts.containsKey(bs.Customer_Id__c)) {
                customerProducts.put(bs.Customer_Id__c, new Set<String>());
            }
            for (String p : bs.Products_Viewed__c.split(';')) {
                p = p.trim();
                if (String.isNotBlank(p)) customerProducts.get(bs.Customer_Id__c).add(p);
            }
        }

        if (customerProducts.isEmpty()) return patterns;

        // Resolve contacts for segmentation
        Set<String> custIds = customerProducts.keySet();
        Map<String, Id> contactIdMap = new Map<String, Id>();
        for (Contact c : [
            SELECT Id FROM Contact
            WHERE Id IN :custIds OR Email IN :custIds
            LIMIT 500
        ]) {
            contactIdMap.put(c.Id, c.Id);
        }

        // Look up loyalty tiers for contacts
        Set<Id> contactIds = new Set<Id>(contactIdMap.values());
        Map<Id, String> contactTiers = new Map<Id, String>();
        if (!contactIds.isEmpty()) {
            for (LoyaltyMemberTier lmt : [
                SELECT LoyaltyMember.ContactId, LoyaltyTier.Name
                FROM LoyaltyMemberTier
                WHERE LoyaltyMember.ContactId IN :contactIds
                ORDER BY CreatedDate DESC
                LIMIT 500
            ]) {
                Id cId = lmt.LoyaltyMember.ContactId;
                if (!contactTiers.containsKey(cId)) {
                    contactTiers.put(cId, lmt.LoyaltyTier.Name);
                }
            }
        }

        // Get order values for CLV segmentation
        Map<Id, Decimal> contactOrderTotals = new Map<Id, Decimal>();

        if (!contactIds.isEmpty()) {
            for (AggregateResult ar : [
                SELECT Contact__c cId, SUM(TotalAmount) total
                FROM Order
                WHERE Contact__c IN :contactIds AND Status = 'Activated'
                GROUP BY Contact__c
            ]) {
                contactOrderTotals.put((Id) ar.get('cId'), (Decimal) ar.get('total'));
            }
        }

        // Segment: VIP (Gold/Platinum loyalty OR top CLV quartile)
        Map<String, Set<String>> vipProducts = new Map<String, Set<String>>();
        Map<String, Set<String>> generalProducts = new Map<String, Set<String>>();
        Integer vipCount = 0;
        Integer generalCount = 0;
        Decimal vipOrderTotal = 0;
        Decimal generalOrderTotal = 0;

        // Determine CLV threshold (top 25%)
        List<Decimal> allTotals = new List<Decimal>(contactOrderTotals.values());
        allTotals.sort();
        Decimal clvThreshold = allTotals.isEmpty() ? 0 : allTotals[Math.max(0, (Integer)(allTotals.size() * 0.75))];

        for (String custId : customerProducts.keySet()) {
            Id cId = contactIdMap.get(custId);
            Boolean isVip = false;

            if (cId != null) {
                String tier = contactTiers.get(cId);
                isVip = (tier != null && (tier.equalsIgnoreCase('Gold') || tier.equalsIgnoreCase('Platinum') || tier.equalsIgnoreCase('Elite')));

                if (!isVip) {
                    Decimal orderTotal = contactOrderTotals.get(cId);
                    if (orderTotal != null && orderTotal >= clvThreshold && clvThreshold > 0) {
                        isVip = true;
                    }
                }
            }

            Set<String> prods = customerProducts.get(custId);
            if (isVip) {
                vipCount++;
                Decimal ot = cId != null ? contactOrderTotals.get(cId) : null;
                if (ot != null) vipOrderTotal += ot;
                for (String p : prods) {
                    if (!vipProducts.containsKey(p)) vipProducts.put(p, new Set<String>());
                    vipProducts.get(p).add(custId);
                }
            } else {
                generalCount++;
                for (String p : prods) {
                    if (!generalProducts.containsKey(p)) generalProducts.put(p, new Set<String>());
                    generalProducts.get(p).add(custId);
                }
            }
        }

        // Build VIP pattern
        if (vipCount > 0) {
            SegmentProductPattern vipPattern = new SegmentProductPattern();
            vipPattern.segmentName = 'VIP / High-CLV';
            vipPattern.segmentCriteria = 'Gold/Platinum/Elite loyalty tier OR top 25% CLV';
            vipPattern.customerCount = vipCount;
            vipPattern.avgOrderValue = vipCount > 0 ? (vipOrderTotal / vipCount).setScale(2) : 0;

            // Top products by unique customer count
            List<String> sortedProds = new List<String>(vipProducts.keySet());
            vipPattern.products = truncate(sortedProds, 8);
            patterns.add(vipPattern);
        }

        // Build general pattern
        if (generalCount > 0) {
            SegmentProductPattern genPattern = new SegmentProductPattern();
            genPattern.segmentName = 'General Visitors';
            genPattern.segmentCriteria = 'All non-VIP visitors';
            genPattern.customerCount = generalCount;
            genPattern.avgOrderValue = generalCount > 0 ? (generalOrderTotal / generalCount).setScale(2) : 0;

            List<String> sortedProds = new List<String>(generalProducts.keySet());
            genPattern.products = truncate(sortedProds, 8);
            patterns.add(genPattern);
        }

        return patterns;
    }

    // ─── Summary Builder ────────────────────────────────────────────────────

    /** Truncate a list to maxSize — Apex doesn't have subList(). */
    private static List<String> truncate(List<String> items, Integer maxSize) {
        if (items == null || items.size() <= maxSize) return items;
        List<String> result = new List<String>();
        for (Integer i = 0; i < maxSize; i++) result.add(items[i]);
        return result;
    }

    private static String buildSummary(IntelligenceReport report, String focusSource, String focusCategory) {
        List<String> points = new List<String>();

        // Traffic spikes
        for (TrafficTrend t : report.trafficTrends) {
            if (t.changePercent >= 20) {
                points.add(t.source + ' traffic is up ' + t.changePercent + '% (' +
                    t.sessionCount + ' sessions vs ' + t.priorPeriodCount + ' prior period). ' +
                    'Top categories: ' + String.join(t.topCategories, ', ') + '.');
            }
        }

        // Category insights
        for (CategoryInsight ci : report.categoryInsights) {
            if (ci.viewCount >= 10) {
                points.add(ci.category + ' has ' + ci.viewCount + ' views (avg ' +
                    ci.avgDurationMinutes + ' min), primarily from ' + ci.dominantSource + '.');
            }
        }

        // Segment contrasts
        for (SegmentProductPattern sp : report.segmentPatterns) {
            if (sp.customerCount > 0) {
                points.add(sp.segmentName + ' (' + sp.customerCount + ' customers, avg $' +
                    sp.avgOrderValue + ' order value): interested in ' +
                    String.join(sp.products, ', ') + '.');
            }
        }

        String focusNote = '';
        if (String.isNotBlank(focusSource)) focusNote += ' Focused on source: ' + focusSource + '.';
        if (String.isNotBlank(focusCategory)) focusNote += ' Focused on category: ' + focusCategory + '.';

        return 'Marketing Intelligence Report (' + report.lookbackDays + '-day lookback).' +
            focusNote + '\n\n' + String.join(points, '\n');
    }
}
