// Check which demo personas have matching Contact records in this org.
List<String> demoEmails = new List<String>{
    'sarah.chen@example.com',
    'james.rodriguez@example.com',
    'maya.thompson@example.com',
    'david.kim@example.com',
    'marcus.w@example.com',
    'aisha.patel@example.com',
    'priya.sharma@example.com'
};

Map<String, Contact> byEmail = new Map<String, Contact>();
for (Contact c : [SELECT Id, FirstName, LastName, Email FROM Contact WHERE Email IN :demoEmails]) {
    byEmail.put(c.Email, c);
}

System.debug('=== DEMO CONTACT HEALTH CHECK ===');
for (String email : demoEmails) {
    Contact c = byEmail.get(email);
    if (c == null) {
        System.debug('MISSING: ' + email + '  (no Contact record)');
    } else {
        Boolean idLooksValid = c.Id != null && String.valueOf(c.Id).startsWith('003') && (String.valueOf(c.Id).length() == 18 || String.valueOf(c.Id).length() == 15);
        System.debug((idLooksValid ? 'OK     ' : 'BAD ID ') + ': ' + email + '  -> ' + c.Id + '  (' + c.FirstName + ' ' + c.LastName + ')');
    }
}

// Also check that recent Meaningful_Event__c records have valid Contact links
System.debug('');
System.debug('=== RECENT MEANINGFUL EVENTS WITH BAD/MISSING CONTACT ===');
for (Meaningful_Event__c me : [
    SELECT Id, Contact__c, Event_Type__c, Description__c, CreatedDate
    FROM Meaningful_Event__c
    WHERE CreatedDate = LAST_N_DAYS:30
    ORDER BY CreatedDate DESC
    LIMIT 50
]) {
    if (me.Contact__c == null) {
        System.debug('NULL Contact: ' + me.Id + '  type=' + me.Event_Type__c + '  desc=' + me.Description__c);
    }
}
