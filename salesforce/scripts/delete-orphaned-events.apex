// Delete orphaned Meaningful_Event__c records (those with null Contact__c).
// Per directive: only events tied to a contactable record should exist.
List<Meaningful_Event__c> orphans = [
    SELECT Id, Event_Type__c, Description__c, CreatedDate
    FROM Meaningful_Event__c
    WHERE Contact__c = null
];

System.debug('Found ' + orphans.size() + ' orphaned meaningful events to delete:');
for (Meaningful_Event__c me : orphans) {
    System.debug('  ' + me.Id + '  type=' + me.Event_Type__c + '  desc=' + me.Description__c + '  created=' + me.CreatedDate);
}

if (!orphans.isEmpty()) {
    // Cascade: also remove any Journey_Approval__c records pointing to these events
    Set<Id> orphanIds = new Map<Id, Meaningful_Event__c>(orphans).keySet();
    List<Journey_Approval__c> linkedApprovals = [
        SELECT Id FROM Journey_Approval__c WHERE Meaningful_Event__c IN :orphanIds
    ];
    if (!linkedApprovals.isEmpty()) {
        System.debug('Cascade-deleting ' + linkedApprovals.size() + ' linked journey approvals');
        delete linkedApprovals;
    }
    delete orphans;
    System.debug('Deleted ' + orphans.size() + ' orphaned events.');
} else {
    System.debug('No orphans found — nothing to delete.');
}
