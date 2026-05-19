// One-shot inspection: Maya's events + recent events across ALL contacts.

Id MAYA = '003Ka00003xPb09IAC';

System.debug('── Maya-specific events ─────────────────────');
for (Meaningful_Event__c e : [
  SELECT Id, Event_Type__c, Description__c, Captured_At__c, Event_Date__c,
         Customer_Id__c, Contact__c, Agent_Note__c, Urgency__c, CreatedDate
    FROM Meaningful_Event__c
   WHERE Contact__c = :MAYA OR Customer_Id__c = :MAYA
   ORDER BY CreatedDate DESC LIMIT 30
]) {
  System.debug(e.CreatedDate.format('yyyy-MM-dd HH:mm') + ' | ' + e.Event_Type__c + ' | ' + e.Description__c);
}

System.debug('── Last 30 events across ALL contacts ───────');
for (Meaningful_Event__c e : [
  SELECT Id, Event_Type__c, Description__c, Captured_At__c, Customer_Id__c, Contact__c,
         Contact__r.Name, Contact__r.Email, CreatedDate
    FROM Meaningful_Event__c
   ORDER BY CreatedDate DESC LIMIT 30
]) {
  System.debug(
    e.CreatedDate.format('yyyy-MM-dd HH:mm') + ' | ' +
    'contact=' + e.Contact__c + ' (' + e.Contact__r.Name + '/' + e.Contact__r.Email + ')' +
    ' | customer_id=' + e.Customer_Id__c +
    ' | ' + e.Event_Type__c + ' | ' + e.Description__c
  );
}

// (Flow-interview log table varies by org; skipping that lookup for now.)
