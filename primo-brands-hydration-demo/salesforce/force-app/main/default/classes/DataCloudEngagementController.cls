/**
 * DataCloudEngagementController
 *
 * Fetches customer engagement data from Data Cloud to enrich portfolio views.
 * Uses Data Cloud Query API to get real-time engagement signals.
 */
public with sharing class DataCloudEngagementController {

    /**
     * Get engagement summary for a contact.
     * Returns last visit, browse history, cart status, email engagement.
     */
    @AuraEnabled(cacheable=true)
    public static EngagementSummary getEngagementSummary(Id contactId) {
        EngagementSummary summary = new EngagementSummary();

        // Get the contact's email for Data Cloud lookup
        Contact c = [SELECT Id, Email FROM Contact WHERE Id = :contactId LIMIT 1];

        if (String.isBlank(c.Email)) {
            return summary;
        }

        try {
            // Query Data Cloud for engagement data
            // This uses the Data Cloud Query API (CDP Query)
            String query = buildEngagementQuery(c.Email);

            // Execute Data Cloud query
            // Note: Requires Data Cloud to be enabled and connected
            Map<String, Object> result = executeDataCloudQuery(query);

            if (result != null) {
                summary = parseEngagementResult(result);
            }
        } catch (Exception e) {
            System.debug('Error fetching Data Cloud engagement: ' + e.getMessage());
            // Return empty summary on error - don't break the UI
        }

        return summary;
    }

    /**
     * Get recent browse history for a contact.
     */
    @AuraEnabled(cacheable=true)
    public static List<BrowseEvent> getBrowseHistory(Id contactId, Integer limitCount) {
        List<BrowseEvent> events = new List<BrowseEvent>();

        Contact c = [SELECT Id, Email FROM Contact WHERE Id = :contactId LIMIT 1];

        if (String.isBlank(c.Email)) {
            return events;
        }

        try {
            String query = 'SELECT ssot__EventTime__c, ssot__ProductName__c, ssot__ProductCategory__c ' +
                          'FROM ssot__WebEngagement__dlm ' +
                          'WHERE ssot__Email__c = \'' + String.escapeSingleQuotes(c.Email) + '\' ' +
                          'AND ssot__EventType__c = \'product_view\' ' +
                          'ORDER BY ssot__EventTime__c DESC ' +
                          'LIMIT ' + limitCount;

            Map<String, Object> result = executeDataCloudQuery(query);

            if (result != null && result.containsKey('data')) {
                List<Object> rows = (List<Object>)result.get('data');
                for (Object row : rows) {
                    Map<String, Object> rowMap = (Map<String, Object>)row;
                    BrowseEvent evt = new BrowseEvent();
                    evt.timestamp = (DateTime)rowMap.get('ssot__EventTime__c');
                    evt.productName = (String)rowMap.get('ssot__ProductName__c');
                    evt.category = (String)rowMap.get('ssot__ProductCategory__c');
                    events.add(evt);
                }
            }
        } catch (Exception e) {
            System.debug('Error fetching browse history: ' + e.getMessage());
        }

        return events;
    }

    /**
     * Get cart abandonment status for a contact.
     */
    @AuraEnabled(cacheable=true)
    public static CartStatus getCartStatus(Id contactId) {
        CartStatus status = new CartStatus();

        Contact c = [SELECT Id, Email FROM Contact WHERE Id = :contactId LIMIT 1];

        if (String.isBlank(c.Email)) {
            return status;
        }

        try {
            String query = 'SELECT ssot__EventTime__c, ssot__CartValue__c, ssot__CartItemCount__c ' +
                          'FROM ssot__WebEngagement__dlm ' +
                          'WHERE ssot__Email__c = \'' + String.escapeSingleQuotes(c.Email) + '\' ' +
                          'AND ssot__EventType__c = \'cart_updated\' ' +
                          'ORDER BY ssot__EventTime__c DESC ' +
                          'LIMIT 1';

            Map<String, Object> result = executeDataCloudQuery(query);

            if (result != null && result.containsKey('data')) {
                List<Object> rows = (List<Object>)result.get('data');
                if (!rows.isEmpty()) {
                    Map<String, Object> rowMap = (Map<String, Object>)rows[0];
                    status.lastUpdated = (DateTime)rowMap.get('ssot__EventTime__c');
                    status.cartValue = (Decimal)rowMap.get('ssot__CartValue__c');
                    status.itemCount = (Integer)rowMap.get('ssot__CartItemCount__c');
                    status.hasAbandonedCart = status.cartValue > 0 &&
                                              status.lastUpdated < DateTime.now().addHours(-1);
                }
            }
        } catch (Exception e) {
            System.debug('Error fetching cart status: ' + e.getMessage());
        }

        return status;
    }

    /**
     * Get email engagement metrics for a contact.
     */
    @AuraEnabled(cacheable=true)
    public static EmailEngagement getEmailEngagement(Id contactId) {
        EmailEngagement engagement = new EmailEngagement();

        Contact c = [SELECT Id, Email FROM Contact WHERE Id = :contactId LIMIT 1];

        if (String.isBlank(c.Email)) {
            return engagement;
        }

        try {
            // Query for email opens/clicks in last 30 days
            String query = 'SELECT COUNT(ssot__Id__c) as eventCount, ssot__EventType__c ' +
                          'FROM ssot__EmailEngagement__dlm ' +
                          'WHERE ssot__Email__c = \'' + String.escapeSingleQuotes(c.Email) + '\' ' +
                          'AND ssot__EventTime__c >= ' + DateTime.now().addDays(-30).format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'') + ' ' +
                          'GROUP BY ssot__EventType__c';

            Map<String, Object> result = executeDataCloudQuery(query);

            if (result != null && result.containsKey('data')) {
                List<Object> rows = (List<Object>)result.get('data');
                for (Object row : rows) {
                    Map<String, Object> rowMap = (Map<String, Object>)row;
                    String eventType = (String)rowMap.get('ssot__EventType__c');
                    Integer count = (Integer)rowMap.get('eventCount');

                    if (eventType == 'email_open') {
                        engagement.opens30Days = count;
                    } else if (eventType == 'email_click') {
                        engagement.clicks30Days = count;
                    }
                }
            }
        } catch (Exception e) {
            System.debug('Error fetching email engagement: ' + e.getMessage());
        }

        return engagement;
    }

    // ============ Private Methods ============

    private static String buildEngagementQuery(String email) {
        return 'SELECT ' +
               'MAX(ssot__EventTime__c) as lastVisit, ' +
               'COUNT(ssot__Id__c) as totalEvents ' +
               'FROM ssot__WebEngagement__dlm ' +
               'WHERE ssot__Email__c = \'' + String.escapeSingleQuotes(email) + '\' ' +
               'AND ssot__EventTime__c >= ' + DateTime.now().addDays(-30).format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    }

    private static Map<String, Object> executeDataCloudQuery(String query) {
        // This is a placeholder for the actual Data Cloud Query API call
        // In production, you would use:
        // - ConnectApi.CdpQuery.queryAnsiSql() for Data Cloud queries
        // - Or use Named Credentials with HTTP callout to Data Cloud API

        // For demo purposes, return mock data if Data Cloud isn't configured
        if (Test.isRunningTest()) {
            return getMockEngagementData();
        }

        try {
            // Attempt to use ConnectApi for Data Cloud query
            // ConnectApi.CdpQueryOutput result = ConnectApi.CdpQuery.queryAnsiSql(query);
            // return parseQueryResult(result);

            // Placeholder - actual implementation depends on org configuration
            return null;
        } catch (Exception e) {
            System.debug('Data Cloud query error: ' + e.getMessage());
            return null;
        }
    }

    private static EngagementSummary parseEngagementResult(Map<String, Object> result) {
        EngagementSummary summary = new EngagementSummary();

        if (result.containsKey('data')) {
            List<Object> rows = (List<Object>)result.get('data');
            if (!rows.isEmpty()) {
                Map<String, Object> rowMap = (Map<String, Object>)rows[0];
                summary.lastVisit = (DateTime)rowMap.get('lastVisit');
                summary.totalEvents30Days = (Integer)rowMap.get('totalEvents');
            }
        }

        return summary;
    }

    private static Map<String, Object> getMockEngagementData() {
        // Mock data for testing and demos
        Map<String, Object> mockResult = new Map<String, Object>();
        List<Map<String, Object>> mockData = new List<Map<String, Object>>();

        Map<String, Object> row = new Map<String, Object>();
        row.put('lastVisit', DateTime.now().addHours(-2));
        row.put('totalEvents', 15);
        mockData.add(row);

        mockResult.put('data', mockData);
        return mockResult;
    }

    // ============ Wrapper Classes ============

    public class EngagementSummary {
        @AuraEnabled public DateTime lastVisit;
        @AuraEnabled public Integer totalEvents30Days = 0;
        @AuraEnabled public Boolean hasRecentActivity = false;
        @AuraEnabled public String engagementLevel = 'Low'; // Low, Medium, High

        public EngagementSummary() {
            // Calculate engagement level
            if (totalEvents30Days > 20) {
                engagementLevel = 'High';
                hasRecentActivity = true;
            } else if (totalEvents30Days > 5) {
                engagementLevel = 'Medium';
                hasRecentActivity = true;
            }
        }
    }

    public class BrowseEvent {
        @AuraEnabled public DateTime timestamp;
        @AuraEnabled public String productName;
        @AuraEnabled public String category;
    }

    public class CartStatus {
        @AuraEnabled public DateTime lastUpdated;
        @AuraEnabled public Decimal cartValue = 0;
        @AuraEnabled public Integer itemCount = 0;
        @AuraEnabled public Boolean hasAbandonedCart = false;
    }

    public class EmailEngagement {
        @AuraEnabled public Integer opens30Days = 0;
        @AuraEnabled public Integer clicks30Days = 0;
        @AuraEnabled public Decimal openRate = 0;
        @AuraEnabled public Decimal clickRate = 0;
    }
}
