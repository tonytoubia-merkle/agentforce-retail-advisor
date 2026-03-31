// Step 1: Create contacts and accounts

Database.DMLOptions dmlOpts = new Database.DMLOptions();
dmlOpts.DuplicateRuleHeader.AllowSave = true;

List<Account> accts = new List<Account>{
    new Account(Name='Olivia Parker Household'),
    new Account(Name='Chloe Rivera Household'),
    new Account(Name='Aisha Johnson Household'),
    new Account(Name='Emma Lee Household'),
    new Account(Name='Sophia Martinez Household'),
    new Account(Name='Priya Patel Household'),
    new Account(Name='Zoe Washington Household'),
    new Account(Name='Isabel Tanaka Household')
};
Database.insert(accts, dmlOpts);

List<Contact> contacts = new List<Contact>{
    new Contact(FirstName='Olivia', LastName='Parker', Email='olivia.p@example.com', AccountId=accts[0].Id, Skin_Type__c='Dry', Merkury_Id__c='MRK-OP-10001'),
    new Contact(FirstName='Chloe', LastName='Rivera', Email='chloe.r@example.com', AccountId=accts[1].Id, Skin_Type__c='Oily', Merkury_Id__c='MRK-CR-10002'),
    new Contact(FirstName='Aisha', LastName='Johnson', Email='aisha.j@example.com', AccountId=accts[2].Id, Skin_Type__c='Combination', Merkury_Id__c='MRK-AJ-10003'),
    new Contact(FirstName='Emma', LastName='Lee', Email='emma.l@example.com', AccountId=accts[3].Id, Skin_Type__c='Normal', Merkury_Id__c='MRK-EL-10004'),
    new Contact(FirstName='Sophia', LastName='Martinez', Email='sophia.m@example.com', AccountId=accts[4].Id, Skin_Type__c='Sensitive', Merkury_Id__c='MRK-SM-10005'),
    new Contact(FirstName='Priya', LastName='Patel', Email='priya.p@example.com', AccountId=accts[5].Id, Skin_Type__c='Dry', Merkury_Id__c='MRK-PP-10006'),
    new Contact(FirstName='Zoe', LastName='Washington', Email='zoe.w@example.com', AccountId=accts[6].Id, Skin_Type__c='Oily', Merkury_Id__c='MRK-ZW-10007'),
    new Contact(FirstName='Isabel', LastName='Tanaka', Email='isabel.t@example.com', AccountId=accts[7].Id, Skin_Type__c='Normal', Merkury_Id__c='MRK-IT-10008')
};
Database.insert(contacts, dmlOpts);

for (Contact c : contacts) {
    System.debug('Contact: ' + c.Id + ' ' + c.FirstName + ' ' + c.LastName + ' Account:' + c.AccountId);
}
System.debug('Step 1 complete: ' + contacts.size() + ' contacts created');
