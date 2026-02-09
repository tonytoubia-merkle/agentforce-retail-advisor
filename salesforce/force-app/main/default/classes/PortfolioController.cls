/**
 * PortfolioController
 *
 * Apex controller for Portfolio Management LWC components.
 * Handles portfolio (Campaign) queries, member management, and escalation actions.
 */
public with sharing class PortfolioController {

    /**
     * Get all portfolios visible to the current user.
     * Admins see all, owners see only their assigned portfolios.
     */
    @AuraEnabled(cacheable=true)
    public static List<PortfolioWrapper> getPortfolios() {
        List<PortfolioWrapper> portfolios = new List<PortfolioWrapper>();

        // Check if user is admin (can modify all Campaigns)
        // In production, you might use a Custom Permission instead
        Boolean isAdmin = Schema.sObjectType.Campaign.isCreateable() &&
                          Schema.sObjectType.Campaign.isDeletable();

        String query = 'SELECT Id, Name, Portfolio_Type__c, Agent_Autonomy__c, ' +
                       'Portfolio_Owner__c, Portfolio_Owner__r.Name, ' +
                       'Escalation_Config__c, Is_Portfolio__c, ' +
                       'NumberOfContacts, NumberOfLeads, Status, ' +
                       '(SELECT Id FROM CampaignMembers WHERE Priority__c = \'Critical\' OR Pending_Action_Type__c != null) ' +
                       'FROM Campaign ' +
                       'WHERE Is_Portfolio__c = true ';

        // Non-admins only see their owned portfolios
        if (!isAdmin) {
            query += 'AND Portfolio_Owner__c = \'' + UserInfo.getUserId() + '\' ';
        }

        query += 'ORDER BY Name';

        List<Campaign> campaigns = Database.query(query);

        for (Campaign c : campaigns) {
            portfolios.add(new PortfolioWrapper(c));
        }

        return portfolios;
    }

    /**
     * Get a single portfolio with full details.
     */
    @AuraEnabled(cacheable=true)
    public static PortfolioWrapper getPortfolio(Id portfolioId) {
        Campaign c = [
            SELECT Id, Name, Portfolio_Type__c, Agent_Autonomy__c,
                   Portfolio_Owner__c, Portfolio_Owner__r.Name,
                   Escalation_Config__c, Is_Portfolio__c,
                   NumberOfContacts, NumberOfLeads, Status
            FROM Campaign
            WHERE Id = :portfolioId AND Is_Portfolio__c = true
            LIMIT 1
        ];

        return new PortfolioWrapper(c);
    }

    /**
     * Get members requiring attention (pending actions).
     */
    @AuraEnabled(cacheable=true)
    public static List<MemberWrapper> getPendingMembers(Id portfolioId) {
        List<MemberWrapper> members = new List<MemberWrapper>();

        List<CampaignMember> campaignMembers = [
            SELECT Id, ContactId, Contact.Name, Contact.Email,
                   LeadId, Lead.Name, Lead.Email,
                   Priority__c, Pending_Action_Type__c, Agent_Suggestion__c,
                   Action_Due_Date__c, Last_Agent_Action__c, Lifetime_Value__c
            FROM CampaignMember
            WHERE CampaignId = :portfolioId
              AND Pending_Action_Type__c != null
            ORDER BY Action_Due_Date__c ASC NULLS LAST
            LIMIT 50
        ];

        // Sort by priority in Apex (SOQL doesn't support CASE in ORDER BY)
        Map<String, Integer> priorityOrder = new Map<String, Integer>{
            'Critical' => 1,
            'High' => 2,
            'Medium' => 3,
            'Low' => 4
        };

        campaignMembers.sort(new PriorityComparator(priorityOrder));

        for (CampaignMember cm : campaignMembers) {
            members.add(new MemberWrapper(cm));
        }

        return members;
    }

    /**
     * Comparator for sorting CampaignMembers by priority.
     */
    public class PriorityComparator implements Comparator<CampaignMember> {
        private Map<String, Integer> priorityOrder;

        public PriorityComparator(Map<String, Integer> priorityOrder) {
            this.priorityOrder = priorityOrder;
        }

        public Integer compare(CampaignMember a, CampaignMember b) {
            Integer priorityA = priorityOrder.get(a.Priority__c) != null ? priorityOrder.get(a.Priority__c) : 99;
            Integer priorityB = priorityOrder.get(b.Priority__c) != null ? priorityOrder.get(b.Priority__c) : 99;

            if (priorityA != priorityB) {
                return priorityA - priorityB;
            }

            // Secondary sort by due date
            if (a.Action_Due_Date__c == null && b.Action_Due_Date__c == null) return 0;
            if (a.Action_Due_Date__c == null) return 1;
            if (b.Action_Due_Date__c == null) return -1;
            return a.Action_Due_Date__c < b.Action_Due_Date__c ? -1 : 1;
        }
    }

    /**
     * Get recent agent activity for a portfolio.
     */
    @AuraEnabled(cacheable=true)
    public static List<Agent_Activity__c> getRecentActivity(Id portfolioId, Integer limitCount) {
        if (limitCount == null || limitCount > 100) {
            limitCount = 20;
        }

        return [
            SELECT Id, Name, Contact__c, Contact__r.Name,
                   Channel__c, Action__c, Status__c, Details__c, Activity_Date__c
            FROM Agent_Activity__c
            WHERE Campaign__c = :portfolioId
            ORDER BY Activity_Date__c DESC
            LIMIT :limitCount
        ];
    }

    /**
     * Get portfolio metrics (aggregated stats).
     */
    @AuraEnabled(cacheable=true)
    public static PortfolioMetrics getPortfolioMetrics(Id portfolioId) {
        PortfolioMetrics metrics = new PortfolioMetrics();

        // Total members
        AggregateResult[] totalResults = [
            SELECT COUNT(Id) total
            FROM CampaignMember
            WHERE CampaignId = :portfolioId
        ];
        metrics.totalCustomers = (Integer)totalResults[0].get('total');

        // Members with recent activity (active)
        AggregateResult[] activeResults = [
            SELECT COUNT(Id) active
            FROM CampaignMember
            WHERE CampaignId = :portfolioId
              AND Last_Agent_Action__c >= :Date.today().addDays(-30)
        ];
        metrics.activeCustomers = (Integer)activeResults[0].get('active');

        // Agent activity today
        Date today = Date.today();
        AggregateResult[] agentResults = [
            SELECT COUNT(Id) total
            FROM Agent_Activity__c
            WHERE Campaign__c = :portfolioId
              AND Activity_Date__c >= :today
              AND Status__c = 'Sent'
        ];
        metrics.agentActionsToday = (Integer)agentResults[0].get('total');

        // Human interventions today (cases)
        AggregateResult[] humanResults = [
            SELECT COUNT(Id) total
            FROM Case
            WHERE Portfolio_Campaign__c = :portfolioId
              AND CreatedDate >= :today
        ];
        metrics.humanInterventionsToday = (Integer)humanResults[0].get('total');

        // Pending actions count
        AggregateResult[] pendingResults = [
            SELECT COUNT(Id) total
            FROM CampaignMember
            WHERE CampaignId = :portfolioId
              AND Pending_Action_Type__c != null
        ];
        metrics.pendingActions = (Integer)pendingResults[0].get('total');

        return metrics;
    }

    /**
     * Approve an agent's suggested action for a member.
     */
    @AuraEnabled
    public static void approveAction(Id memberId) {
        CampaignMember cm = [
            SELECT Id, Pending_Action_Type__c, Agent_Suggestion__c, CampaignId, ContactId
            FROM CampaignMember
            WHERE Id = :memberId
            LIMIT 1
        ];

        // Create activity record for the approval
        Agent_Activity__c activity = new Agent_Activity__c(
            Contact__c = cm.ContactId,
            Campaign__c = cm.CampaignId,
            Action__c = 'Action approved: ' + cm.Pending_Action_Type__c,
            Status__c = 'Approved',
            Details__c = cm.Agent_Suggestion__c,
            Activity_Date__c = DateTime.now()
        );
        insert activity;

        // Clear the pending action
        cm.Pending_Action_Type__c = null;
        cm.Agent_Suggestion__c = null;
        cm.Last_Agent_Action__c = DateTime.now();
        update cm;
    }

    /**
     * Reject an agent's suggested action.
     */
    @AuraEnabled
    public static void rejectAction(Id memberId, String reason) {
        CampaignMember cm = [
            SELECT Id, Pending_Action_Type__c, Agent_Suggestion__c, CampaignId, ContactId
            FROM CampaignMember
            WHERE Id = :memberId
            LIMIT 1
        ];

        // Create activity record for the rejection
        Agent_Activity__c activity = new Agent_Activity__c(
            Contact__c = cm.ContactId,
            Campaign__c = cm.CampaignId,
            Action__c = 'Action rejected: ' + cm.Pending_Action_Type__c,
            Status__c = 'Rejected',
            Details__c = 'Reason: ' + reason + '\n\nOriginal suggestion: ' + cm.Agent_Suggestion__c,
            Activity_Date__c = DateTime.now()
        );
        insert activity;

        // Clear the pending action
        cm.Pending_Action_Type__c = null;
        cm.Agent_Suggestion__c = null;
        update cm;
    }

    /**
     * Take over a customer conversation (create case for human handling).
     */
    @AuraEnabled
    public static Id takeOverCustomer(Id memberId) {
        CampaignMember cm = [
            SELECT Id, ContactId, Contact.Name, CampaignId, Campaign.Name,
                   Agent_Suggestion__c, Pending_Action_Type__c
            FROM CampaignMember
            WHERE Id = :memberId
            LIMIT 1
        ];

        // Create case for human follow-up
        Case c = new Case(
            ContactId = cm.ContactId,
            Subject = 'Portfolio Takeover: ' + cm.Contact.Name,
            Description = 'Human takeover requested for customer in portfolio: ' + cm.Campaign.Name +
                          '\n\nAgent suggestion: ' + cm.Agent_Suggestion__c,
            Portfolio_Campaign__c = cm.CampaignId,
            Escalation_Trigger__c = 'Complex Request',
            Agent_Suggestion__c = cm.Agent_Suggestion__c,
            Status = 'New',
            Priority = 'High',
            OwnerId = UserInfo.getUserId()
        );
        insert c;

        // Create activity record
        Agent_Activity__c activity = new Agent_Activity__c(
            Contact__c = cm.ContactId,
            Campaign__c = cm.CampaignId,
            Action__c = 'Human takeover initiated',
            Status__c = 'Paused',
            Details__c = 'Case created: ' + c.Id,
            Activity_Date__c = DateTime.now()
        );
        insert activity;

        // Clear pending action
        cm.Pending_Action_Type__c = null;
        update cm;

        return c.Id;
    }

    /**
     * Update portfolio autonomy level.
     */
    @AuraEnabled
    public static void updateAutonomyLevel(Id portfolioId, String autonomyLevel) {
        Campaign c = [
            SELECT Id, Agent_Autonomy__c
            FROM Campaign
            WHERE Id = :portfolioId
            LIMIT 1
        ];

        c.Agent_Autonomy__c = autonomyLevel;
        update c;
    }

    // ============ Wrapper Classes ============

    public class PortfolioWrapper {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String portfolioType;
        @AuraEnabled public String autonomyLevel;
        @AuraEnabled public Id ownerId;
        @AuraEnabled public String ownerName;
        @AuraEnabled public Integer totalMembers;
        @AuraEnabled public Integer pendingCount;
        @AuraEnabled public String status;

        public PortfolioWrapper(Campaign c) {
            this.id = c.Id;
            this.name = c.Name;
            this.portfolioType = c.Portfolio_Type__c;
            this.autonomyLevel = c.Agent_Autonomy__c;
            this.ownerId = c.Portfolio_Owner__c;
            this.ownerName = c.Portfolio_Owner__r?.Name;
            this.totalMembers = (c.NumberOfContacts != null ? c.NumberOfContacts : 0) +
                               (c.NumberOfLeads != null ? c.NumberOfLeads : 0);
            this.pendingCount = c.CampaignMembers?.size();
            this.status = c.Status;
        }
    }

    public class MemberWrapper {
        @AuraEnabled public Id id;
        @AuraEnabled public Id contactId;
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String priority;
        @AuraEnabled public String pendingActionType;
        @AuraEnabled public String agentSuggestion;
        @AuraEnabled public DateTime actionDueDate;
        @AuraEnabled public DateTime lastAgentAction;
        @AuraEnabled public Decimal lifetimeValue;

        public MemberWrapper(CampaignMember cm) {
            this.id = cm.Id;
            this.contactId = cm.ContactId != null ? cm.ContactId : cm.LeadId;
            this.name = cm.ContactId != null ? cm.Contact.Name : cm.Lead?.Name;
            this.email = cm.ContactId != null ? cm.Contact.Email : cm.Lead?.Email;
            this.priority = cm.Priority__c;
            this.pendingActionType = cm.Pending_Action_Type__c;
            this.agentSuggestion = cm.Agent_Suggestion__c;
            this.actionDueDate = cm.Action_Due_Date__c;
            this.lastAgentAction = cm.Last_Agent_Action__c;
            this.lifetimeValue = cm.Lifetime_Value__c;
        }
    }

    public class PortfolioMetrics {
        @AuraEnabled public Integer totalCustomers = 0;
        @AuraEnabled public Integer activeCustomers = 0;
        @AuraEnabled public Integer agentActionsToday = 0;
        @AuraEnabled public Integer humanInterventionsToday = 0;
        @AuraEnabled public Integer pendingActions = 0;
    }
}
