// Step 2: Loyalty memberships, tiers, orders, browse sessions, events

// Existing contacts
Id SARAH    = '003Ka00003xPazzIAC';
Id JAMES    = '003Ka00003xPb04IAC';
Id DAVID    = '003Ka00003xPazbIAC';
Id MAYA     = '003Ka00003xPb09IAC';
Id MARCUS   = '003Ka00003xPb0EIAS';
// New contacts
Id OLIVIA   = '003Ka000042yjY6IAI';
Id CHLOE    = '003Ka000042yjY7IAI';
Id AISHA    = '003Ka000042yjY8IAI';
Id EMMA     = '003Ka000042yjY9IAI';
Id SOPHIA   = '003Ka000042yjYAIAY';
Id PRIYA    = '003Ka000042yjYBIAY';
Id ZOE      = '003Ka000042yjYCIAY';
Id ISABEL   = '003Ka000042yjYDIAY';
// Accounts for new contacts
Id OLIVIA_ACCT  = '001Ka00004YCit7IAD';
Id CHLOE_ACCT   = '001Ka00004YCit8IAD';
Id AISHA_ACCT   = '001Ka00004YCit9IAD';
Id EMMA_ACCT    = '001Ka00004YCitAIAT';
Id SOPHIA_ACCT  = '001Ka00004YCitBIAT';
Id PRIYA_ACCT   = '001Ka00004YCitCIAT';
Id ZOE_ACCT     = '001Ka00004YCitDIAT';
Id ISABEL_ACCT  = '001Ka00004YCitEIAT';

Id PROGRAM    = '0lpKa000000ckIRIAY';
Id PRICEBOOK  = '01sKa000004dP9VIAU';
Id TIER_GROUP = '0ltKa000000clrMIAQ';
Id GOLD_T     = '0lgKa000000YZilIAG';
Id PLAT_T     = '0lgKa000000YZimIAG';
Id SILVER_T   = '0lgKa000000YZikIAG';
Id BRONZE_T   = '0lgKa000000YZijIAG';

String ts = String.valueOf(Datetime.now().getTime()).right(8);

// ─── Loyalty Members ────────────────────────────────────────────────────────

List<LoyaltyProgramMember> members = new List<LoyaltyProgramMember>();
List<Id> newContactIds = new List<Id>{OLIVIA, CHLOE, AISHA, EMMA, SOPHIA, PRIYA, ZOE, ISABEL};
for (Integer i = 0; i < newContactIds.size(); i++) {
    members.add(new LoyaltyProgramMember(
        ProgramId = PROGRAM, ContactId = newContactIds[i],
        MemberStatus = 'Active', MemberType = 'Individual',
        MembershipNumber = 'BL-' + ts + String.valueOf(i),
        EnrollmentDate = Date.today().addDays(-Math.mod(i * 73, 400) - 60),
        CanReceivePromotions = true, CanReceivePartnerPromotions = true
    ));
}
insert members;
System.debug('Loyalty members: ' + members.size());

// ─── Tier Assignments ───────────────────────────────────────────────────────

List<String> tNames = new List<String>{'Gold','Platinum','Silver','Gold','Bronze','Silver','Bronze','Gold'};
List<Id> tIds = new List<Id>{GOLD_T, PLAT_T, SILVER_T, GOLD_T, BRONZE_T, SILVER_T, BRONZE_T, GOLD_T};

List<LoyaltyMemberTier> tiers = new List<LoyaltyMemberTier>();
for (Integer i = 0; i < members.size(); i++) {
    tiers.add(new LoyaltyMemberTier(
        Name = tNames[i], LoyaltyMemberId = members[i].Id,
        LoyaltyTierId = tIds[i], LoyaltyTierGroupId = TIER_GROUP,
        EffectiveDate = Date.today().addDays(-180 + i * 20)
    ));
}
insert tiers;
System.debug('Tiers assigned: ' + tiers.size());

// ─── Pricebook Entries ──────────────────────────────────────────────────────

List<Id> allProducts = new List<Id>{
    '01tKa0000098VzaIAE','01tKa0000098W25IAE','01tKa0000098W1vIAE','01tKa0000098W12IAE',
    '01tKa0000098VzBIAU','01tKa0000098W2KIAU','01tKa0000098W6lIAE',
    '01tKa0000098W4BIAU','01tKa0000098W1WIAU','01tKa0000098W1lIAE','01tKa0000098W4QIAU',
    '01tKa0000098W59IAE','01tKa0000098W3IIAU','01tKa0000098W4kIAE','01tKa0000098W2tIAE'
};

Map<Id, Id> pbeMap = new Map<Id, Id>();
for (PricebookEntry pbe : [SELECT Id, Product2Id FROM PricebookEntry WHERE Pricebook2Id = :PRICEBOOK AND Product2Id IN :allProducts]) {
    pbeMap.put(pbe.Product2Id, pbe.Id);
}
Map<Id, Decimal> priceMap = new Map<Id, Decimal>();
for (Product2 p : [SELECT Id, Price__c FROM Product2 WHERE Id IN :allProducts]) {
    priceMap.put(p.Id, p.Price__c != null ? p.Price__c : 30);
}
List<PricebookEntry> newPbes = new List<PricebookEntry>();
for (Id pId : allProducts) {
    if (!pbeMap.containsKey(pId)) {
        newPbes.add(new PricebookEntry(Pricebook2Id=PRICEBOOK, Product2Id=pId, UnitPrice=priceMap.containsKey(pId)?priceMap.get(pId):30, IsActive=true));
    }
}
if (!newPbes.isEmpty()) {
    insert newPbes;
    for (PricebookEntry pbe : newPbes) pbeMap.put(pbe.Product2Id, pbe.Id);
}
System.debug('PBEs ready: ' + pbeMap.size());

// ─── Orders ─────────────────────────────────────────────────────────────────
// Lapsed VIPs: James (Plat, 400d ago), Olivia (Gold, 380d), Isabel (Gold, 390d)
// Active: Chloe (Plat, recent), Sarah (Gold, recent), Emma, Aisha, others

// Existing contact accounts
Map<Id, Id> existingAccts = new Map<Id, Id>();
for (Contact c : [SELECT Id, AccountId FROM Contact WHERE Id IN (:SARAH,:JAMES,:DAVID,:MAYA,:MARCUS)]) {
    existingAccts.put(c.Id, c.AccountId);
}

// Order definitions: contact, account, daysAgo, productId
List<List<Object>> orderSpecs = new List<List<Object>>{
    // James (Platinum) — LAPSED 400+ days
    new List<Object>{JAMES, existingAccts.get(JAMES), 400, '01tKa0000098VzBIAU'},
    new List<Object>{JAMES, existingAccts.get(JAMES), 500, '01tKa0000098W1vIAE'},
    new List<Object>{JAMES, existingAccts.get(JAMES), 620, '01tKa0000098W4BIAU'},
    // Olivia (Gold) — LAPSED 380+ days
    new List<Object>{OLIVIA, OLIVIA_ACCT, 380, '01tKa0000098VzBIAU'},
    new List<Object>{OLIVIA, OLIVIA_ACCT, 450, '01tKa0000098W1vIAE'},
    // Isabel (Gold) — LAPSED 390+ days
    new List<Object>{ISABEL, ISABEL_ACCT, 390, '01tKa0000098W2KIAU'},
    new List<Object>{ISABEL, ISABEL_ACCT, 520, '01tKa0000098W4kIAE'},
    // Chloe (Platinum) — ACTIVE, recent + old
    new List<Object>{CHLOE, CHLOE_ACCT, 5, '01tKa0000098VzBIAU'},
    new List<Object>{CHLOE, CHLOE_ACCT, 30, '01tKa0000098W1vIAE'},
    new List<Object>{CHLOE, CHLOE_ACCT, 90, '01tKa0000098W4BIAU'},
    // Sarah (Gold) — ACTIVE
    new List<Object>{SARAH, existingAccts.get(SARAH), 10, '01tKa0000098VzaIAE'},
    new List<Object>{SARAH, existingAccts.get(SARAH), 45, '01tKa0000098W1vIAE'},
    // Emma (Gold) — ACTIVE
    new List<Object>{EMMA, EMMA_ACCT, 15, '01tKa0000098W4BIAU'},
    // Aisha (Silver) — recent
    new List<Object>{AISHA, AISHA_ACCT, 3, '01tKa0000098VzaIAE'},
    // Sophia — recent
    new List<Object>{SOPHIA, SOPHIA_ACCT, 7, '01tKa0000098W59IAE'},
    // Priya — recent
    new List<Object>{PRIYA, PRIYA_ACCT, 12, '01tKa0000098VzaIAE'},
    // Zoe — recent
    new List<Object>{ZOE, ZOE_ACCT, 2, '01tKa0000098W4BIAU'},
    // David (Silver) — moderate
    new List<Object>{DAVID, existingAccts.get(DAVID), 20, '01tKa0000098VzaIAE'}
};

Integer ordersCreated = 0;
for (List<Object> spec : orderSpecs) {
    Id cId = (Id) spec[0];
    Id aId = (Id) spec[1];
    Integer daysAgo = (Integer) spec[2];
    Id prodId = (Id) spec[3];
    if (aId == null) continue;

    try {
        Order o = new Order(AccountId=aId, Pricebook2Id=PRICEBOOK, Status='Draft', EffectiveDate=Date.today().addDays(-daysAgo), Contact__c=cId);
        insert o;
        Id pbeId = pbeMap.get(prodId);
        Decimal price = priceMap.containsKey(prodId) ? priceMap.get(prodId) : 30;
        insert new OrderItem(OrderId=o.Id, PricebookEntryId=pbeId, Quantity=1, UnitPrice=price);
        o.Status = 'Activated';
        update o;
        ordersCreated++;
    } catch (Exception e) {
        System.debug(LoggingLevel.WARN, 'Order fail: ' + e.getMessage());
    }
}
System.debug('Orders created: ' + ordersCreated);
