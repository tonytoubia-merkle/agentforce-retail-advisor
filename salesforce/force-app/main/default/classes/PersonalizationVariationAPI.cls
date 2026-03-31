/**
 * REST API for Personalization Variations.
 *
 * Endpoints (via /services/apexrest/personalization/variations):
 *
 *   POST /   — Resolve or create a variation
 *     Body for RESOLVE:  { "action": "resolve", "pointName": "Hero_Banner", "context": { "utm_source": "tiktok" }, "channel": "Web" }
 *     Body for CREATE:   { "action": "create", "pointName": "Hero_Banner", "variationName": "TikTok Hero", "segmentRules": {...}, "content": {...}, "priority": 200, "channel": "Web" }
 *     Body for LIST:     { "action": "list", "pointName": "Hero_Banner" }
 *
 *   PATCH /  — Update a variation
 *     Body: { "variationId": "a0xXXXX", "content": {...}, "segmentRules": {...}, "isActive": true, "priority": 150 }
 *
 *   DELETE / — Delete a variation
 *     Body: { "variationId": "a0xXXXX" }
 */
@RestResource(urlMapping='/personalization/variations/*')
global with sharing class PersonalizationVariationAPI {

    @HttpPost
    global static String doPost() {
        RestRequest req = RestContext.request;
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
        String action = (String) body.get('action');

        if (action == 'resolve') {
            return handleResolve(body);
        } else if (action == 'create') {
            return handleCreate(body);
        } else if (action == 'list') {
            return handleList(body);
        }
        return JSON.serialize(new Map<String, Object>{ 'error' => 'Unknown action: ' + action });
    }

    @HttpPatch
    global static String doPatch() {
        RestRequest req = RestContext.request;
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
        return handleUpdate(body);
    }

    @HttpDelete
    global static String doDelete() {
        RestRequest req = RestContext.request;
        // For DELETE, parse variationId from URL or query params
        String variationId = req.requestURI.substringAfterLast('/');
        if (String.isBlank(variationId) || variationId == 'variations') {
            variationId = req.params.get('variationId');
        }
        if (String.isBlank(variationId)) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'Missing variationId' });
        }
        return handleDelete(variationId);
    }

    // ── Resolve ─────────────────────────────────────────────────────────────

    private static String handleResolve(Map<String, Object> body) {
        String pointName = (String) body.get('pointName');
        Map<String, Object> ctx = (Map<String, Object>) body.get('context');
        String channel = (String) body.get('channel');

        if (String.isBlank(pointName)) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'Missing pointName' });
        }

        PersonalizationVariationService.VariationResult result =
            PersonalizationVariationService.resolve(pointName, ctx, channel);

        if (result == null) {
            return JSON.serialize(new Map<String, Object>{ 'matched' => false, 'pointName' => pointName });
        }

        return JSON.serialize(new Map<String, Object>{
            'matched' => true,
            'variationId' => result.variationId,
            'pointName' => result.pointName,
            'variationName' => result.variationName,
            'content' => result.content,
            'priority' => result.priority,
            'segmentRules' => result.segmentRules
        });
    }

    // ── Create ──────────────────────────────────────────────────────────────

    private static String handleCreate(Map<String, Object> body) {
        String pointName = (String) body.get('pointName');
        String variationName = (String) body.get('variationName');
        Map<String, Object> content = (Map<String, Object>) body.get('content');
        Map<String, Object> segmentRules = (Map<String, Object>) body.get('segmentRules');
        Integer priority = body.get('priority') != null ? Integer.valueOf(body.get('priority')) : 100;
        String channel = (String) body.get('channel');

        if (String.isBlank(pointName) || String.isBlank(variationName) || content == null) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'Missing required fields: pointName, variationName, content' });
        }

        Personalization_Variation__c v = new Personalization_Variation__c(
            Point_Name__c = pointName,
            Variation_Name__c = variationName,
            Content_JSON__c = JSON.serialize(content),
            Segment_Rules__c = segmentRules != null ? JSON.serialize(segmentRules) : '{}',
            Priority__c = priority,
            Is_Active__c = true,
            Channel__c = String.isNotBlank(channel) ? channel : 'All',
            Created_By_API__c = true
        );

        // Handle optional scheduling
        if (body.get('startDate') != null) {
            v.Start_Date__c = DateTime.valueOf((String) body.get('startDate'));
        }
        if (body.get('endDate') != null) {
            v.End_Date__c = DateTime.valueOf((String) body.get('endDate'));
        }

        insert v;

        return JSON.serialize(new Map<String, Object>{
            'success' => true,
            'variationId' => v.Id,
            'name' => v.Name,
            'variationName' => variationName
        });
    }

    // ── List ────────────────────────────────────────────────────────────────

    private static String handleList(Map<String, Object> body) {
        String pointName = (String) body.get('pointName');
        if (String.isBlank(pointName)) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'Missing pointName' });
        }

        List<Personalization_Variation__c> variations =
            PersonalizationVariationService.listVariations(pointName);

        List<Map<String, Object>> results = new List<Map<String, Object>>();
        for (Personalization_Variation__c v : variations) {
            results.add(new Map<String, Object>{
                'id' => v.Id,
                'name' => v.Name,
                'variationName' => v.Variation_Name__c,
                'pointName' => v.Point_Name__c,
                'segmentRules' => String.isNotBlank(v.Segment_Rules__c)
                    ? JSON.deserializeUntyped(v.Segment_Rules__c) : new Map<String, Object>(),
                'content' => String.isNotBlank(v.Content_JSON__c)
                    ? JSON.deserializeUntyped(v.Content_JSON__c) : new Map<String, Object>(),
                'priority' => v.Priority__c,
                'isActive' => v.Is_Active__c,
                'channel' => v.Channel__c,
                'startDate' => v.Start_Date__c,
                'endDate' => v.End_Date__c,
                'createdByAPI' => v.Created_By_API__c,
                'createdDate' => v.CreatedDate
            });
        }

        return JSON.serialize(new Map<String, Object>{
            'pointName' => pointName,
            'count' => results.size(),
            'variations' => results
        });
    }

    // ── Update ──────────────────────────────────────────────────────────────

    private static String handleUpdate(Map<String, Object> body) {
        String variationId = (String) body.get('variationId');
        if (String.isBlank(variationId)) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'Missing variationId' });
        }

        Personalization_Variation__c v = new Personalization_Variation__c(Id = variationId);
        Boolean hasUpdate = false;

        if (body.containsKey('content')) {
            v.Content_JSON__c = JSON.serialize(body.get('content'));
            hasUpdate = true;
        }
        if (body.containsKey('segmentRules')) {
            v.Segment_Rules__c = JSON.serialize(body.get('segmentRules'));
            hasUpdate = true;
        }
        if (body.containsKey('priority')) {
            v.Priority__c = Integer.valueOf(body.get('priority'));
            hasUpdate = true;
        }
        if (body.containsKey('isActive')) {
            v.Is_Active__c = (Boolean) body.get('isActive');
            hasUpdate = true;
        }
        if (body.containsKey('variationName')) {
            v.Variation_Name__c = (String) body.get('variationName');
            hasUpdate = true;
        }
        if (body.containsKey('channel')) {
            v.Channel__c = (String) body.get('channel');
            hasUpdate = true;
        }

        if (!hasUpdate) {
            return JSON.serialize(new Map<String, Object>{ 'error' => 'No fields to update' });
        }

        update v;
        return JSON.serialize(new Map<String, Object>{ 'success' => true, 'variationId' => variationId });
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    private static String handleDelete(String variationId) {
        delete [SELECT Id FROM Personalization_Variation__c WHERE Id = :variationId];
        return JSON.serialize(new Map<String, Object>{ 'success' => true, 'variationId' => variationId });
    }
}
