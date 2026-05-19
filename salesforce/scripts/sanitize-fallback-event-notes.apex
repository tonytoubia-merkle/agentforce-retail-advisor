// sanitize-fallback-event-notes.apex
//
// One-off: clear the "Client fallback write..." technical phrase from any
// Meaningful_Event__c rows that were written by the SPA's fallback path
// before the note text was sanitized. Replaces the Agent_Note__c with a
// natural-sounding placeholder so the Demo Panel reads cleanly.
//
// Idempotent: re-running is a no-op once all matching rows are cleared.

// Agent_Note__c is a long text area in this org — not filterable in SOQL.
// Pull recent rows and filter client-side.
List<Meaningful_Event__c> recent = [
  SELECT Id, Description__c, Agent_Note__c, CreatedDate
    FROM Meaningful_Event__c
   WHERE CreatedDate = LAST_N_DAYS:30
   ORDER BY CreatedDate DESC
];
List<Meaningful_Event__c> leaks = new List<Meaningful_Event__c>();
for (Meaningful_Event__c e : recent) {
  if (e.Agent_Note__c != null && e.Agent_Note__c.startsWith('Client fallback write')) {
    leaks.add(e);
  }
}

System.debug('Rows with leaked fallback note: ' + leaks.size());
for (Meaningful_Event__c e : leaks) {
  System.debug('  ' + e.CreatedDate.format('yyyy-MM-dd HH:mm') + ' | ' + e.Description__c + ' | ' + e.Agent_Note__c);
  // Strip the technical phrase; leave the note empty (description carries
  // the user-facing info on its own).
  e.Agent_Note__c = null;
}
if (!leaks.isEmpty()) {
  update leaks;
  System.debug('Cleared Agent_Note__c on ' + leaks.size() + ' rows.');
}
