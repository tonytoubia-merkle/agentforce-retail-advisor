/**
 * Seeds realistic marketing intelligence data for the Campaign Planner demo:
 * - New contacts with varying profiles
 * - Loyalty memberships at different tiers
 * - Historical orders (some recent, some lapsed for winback)
 * - Browse sessions with UTM attribution across channels
 * - Meaningful events for journey batch processing
 *
 * Run: sf apex run --file salesforce/scripts/seed-marketing-intelligence-data.apex --target-org my-org
 */

// ─── Constants ──────────────────────────────────────────────────────────────

Id BEAUTE_PROGRAM = '0lpKa000000ckIRIAY';
Id BEAUTY_POINTS = '0lcKa000000xkFYIAY';
Id PRICEBOOK = '01sKa000004dP9VIAU';
Id TIER_GROUP = '0ltKa000000clrMIAQ';
Id GOLD_TIER = '0lgKa000000YZilIAG';
Id PLATINUM_TIER = '0lgKa000000YZimIAG';
Id SILVER_TIER = '0lgKa000000YZikIAG';
Id BRONZE_TIER = '0lgKa000000YZijIAG';

// Existing contacts
Id SARAH_CHEN    = '003Ka00003xPazzIAC';  // Gold
Id JAMES_RODZ    = '003Ka00003xPb04IAC';  // Platinum — will be lapsed VIP
Id DAVID_KIM     = '003Ka00003xPazbIAC';  // Silver
Id MAYA_THOMPSON = '003Ka00003xPb09IAC';  // Bronze
Id MARCUS_WILLIAMS = '003Ka00003xPb0EIAS'; // Bronze

// Existing loyalty members
Id SARAH_MEMBER  = '0lMKa00000QGQQyMAP';
Id JAMES_MEMBER  = '0lMKa00000QGQQzMAP';
Id DAVID_MEMBER  = '0lMKa00000QGQR0MAP';
Id MAYA_MEMBER   = '0lMKa00000QGQR1MAP';
Id MARCUS_MEMBER = '0lMKa00000QGQR2MAP';

// Products (real BEAUTE catalog)
List<Id> CLEANSER_PRODUCTS = new List<Id>{
    '01tKa0000098VzaIAE',  // Gentle Foaming Cleanser — SERENE $28
    '01tKa0000098W25IAE'   // Benzoyl Peroxide 2.5% Gel — DERMAFIX $24
};
List<Id> SERUM_PRODUCTS = new List<Id>{
    '01tKa0000098W1vIAE',  // AHA/BHA Exfoliating Serum — DERMAFIX $48
    '01tKa0000098W12IAE'   // Clarifying BHA Serum — LUMIERE $45
};
List<Id> PREMIUM_PRODUCTS = new List<Id>{
    '01tKa0000098VzBIAU',  // Ultra Rich Barrier Cream — SERENE $64
    '01tKa0000098W2KIAU',  // Glycolic Acid 10% Peel Pads — DERMAFIX $52
    '01tKa0000098W6lIAE'   // Gentle Eyes Sensitive Eye Cream — SERENE $48
};
List<Id> MAKEUP_PRODUCTS = new List<Id>{
    '01tKa0000098W4BIAU',  // Hydra Glow Primer — LUMIERE $36
    '01tKa0000098W1WIAU',  // All-Day Waterproof Mascara — LUMIERE $28
    '01tKa0000098W1lIAE',  // Dewy Liquid Blush — LUMIERE $32
    '01tKa0000098W4QIAU'   // Micro Brow Pencil — LUMIERE $24
};
List<Id> HAIR_PRODUCTS = new List<Id>{
    '01tKa0000098W59IAE',  // Thermal Shield Heat Protectant — MAISON $28
    '01tKa0000098W3IIAU',  // Detangling Leave-In Conditioner — MAISON $28
    '01tKa0000098W4kIAE',  // Weekly Repair Hair Mask — MAISON $42
    '01tKa0000098W2tIAE'   // Root Lift Volumizing Shampoo — MAISON $28
};

// ─── 1. Create new contacts for wider audience ──────────────────────────────

System.debug('=== Creating new contacts ===');

List<Account> newAccounts = new List<Account>{
    new Account(Name='Olivia Parker Household'),
    new Account(Name='Chloe Rivera Household'),
    new Account(Name='Aisha Johnson Household'),
    new Account(Name='Emma Lee Household'),
    new Account(Name='Sophia Martinez Household'),
    new Account(Name='Priya Patel Household'),
    new Account(Name='Zoe Washington Household'),
    new Account(Name='Isabel Tanaka Household')
};
Database.DMLOptions dmlOpts = new Database.DMLOptions();
dmlOpts.DuplicateRuleHeader.AllowSave = true;
Database.insert(newAccounts, dmlOpts);

List<Contact> newContacts = new List<Contact>{
    new Contact(FirstName='Olivia', LastName='Parker', Email='olivia.p@example.com', AccountId=newAccounts[0].Id, Skin_Type__c='Dry', Merkury_Id__c='MRK-OP-10001'),
    new Contact(FirstName='Chloe', LastName='Rivera', Email='chloe.r@example.com', AccountId=newAccounts[1].Id, Skin_Type__c='Oily', Merkury_Id__c='MRK-CR-10002'),
    new Contact(FirstName='Aisha', LastName='Johnson', Email='aisha.j@example.com', AccountId=newAccounts[2].Id, Skin_Type__c='Combination', Merkury_Id__c='MRK-AJ-10003'),
    new Contact(FirstName='Emma', LastName='Lee', Email='emma.l@example.com', AccountId=newAccounts[3].Id, Skin_Type__c='Normal', Merkury_Id__c='MRK-EL-10004'),
    new Contact(FirstName='Sophia', LastName='Martinez', Email='sophia.m@example.com', AccountId=newAccounts[4].Id, Skin_Type__c='Sensitive', Merkury_Id__c='MRK-SM-10005'),
    new Contact(FirstName='Priya', LastName='Patel', Email='priya.p@example.com', AccountId=newAccounts[5].Id, Skin_Type__c='Dry', Merkury_Id__c='MRK-PP-10006'),
    new Contact(FirstName='Zoe', LastName='Washington', Email='zoe.w@example.com', AccountId=newAccounts[6].Id, Skin_Type__c='Oily', Merkury_Id__c='MRK-ZW-10007'),
    new Contact(FirstName='Isabel', LastName='Tanaka', Email='isabel.t@example.com', AccountId=newAccounts[7].Id, Skin_Type__c='Normal', Merkury_Id__c='MRK-IT-10008')
};
Database.insert(newContacts, dmlOpts);
System.debug('Created ' + newContacts.size() + ' contacts');

// ─── 2. Enroll new contacts in loyalty program ─────────────────────────────

System.debug('=== Enrolling loyalty members ===');

List<LoyaltyProgramMember> newMembers = new List<LoyaltyProgramMember>();
for (Integer i = 0; i < newContacts.size(); i++) {
    newMembers.add(new LoyaltyProgramMember(
        ProgramId = BEAUTE_PROGRAM,
        ContactId = newContacts[i].Id,
        MemberStatus = 'Active',
        MemberType = 'Individual',
        MembershipNumber = 'BL-' + String.valueOf(Datetime.now().getTime()).right(6) + String.valueOf(i),
        EnrollmentDate = Date.today().addDays(-Math.mod(i * 73, 400) - 60),
        CanReceivePromotions = true,
        CanReceivePartnerPromotions = true
    ));
}
insert newMembers;

// Assign tiers — Olivia=Gold, Chloe=Platinum, others=Silver/Bronze
List<String> tierNames = new List<String>{'Gold', 'Platinum', 'Silver', 'Gold', 'Bronze', 'Silver', 'Bronze', 'Gold'};
List<Id> tierIds = new List<Id>{GOLD_TIER, PLATINUM_TIER, SILVER_TIER, GOLD_TIER, BRONZE_TIER, SILVER_TIER, BRONZE_TIER, GOLD_TIER};
List<Integer> tierDaysAgo = new List<Integer>{180, 120, 90, 200, 60, 150, 30, 240};

List<LoyaltyMemberTier> tierAssignments = new List<LoyaltyMemberTier>();
for (Integer i = 0; i < newMembers.size(); i++) {
    tierAssignments.add(new LoyaltyMemberTier(
        Name = tierNames[i],
        LoyaltyMemberId = newMembers[i].Id,
        LoyaltyTierId = tierIds[i],
        LoyaltyTierGroupId = TIER_GROUP,
        EffectiveDate = Date.today().addDays(-tierDaysAgo[i])
    ));
}
insert tierAssignments;
System.debug('Assigned tiers to ' + tierAssignments.size() + ' members');

// Also upgrade James Rodriguez tier to make winback compelling — he's Platinum but lapsed
// (Already has Platinum tier assigned from earlier seed)

// ─── 3. Create historical orders ───────────────────────────────────────────
// Mix of recent and old orders. VIP customers get higher values.
// James (Platinum) + Isabel (Gold) + Olivia (Gold) will have OLD orders only → churn risk candidates

System.debug('=== Creating orders ===');

// Helper: get or create PricebookEntry
Map<Id, Id> pbeCache = new Map<Id, Id>();
for (PricebookEntry pbe : [SELECT Id, Product2Id FROM PricebookEntry WHERE Pricebook2Id = :PRICEBOOK AND IsActive = true]) {
    pbeCache.put(pbe.Product2Id, pbe.Id);
}

// Collect all product IDs we'll need
Set<Id> allProductIds = new Set<Id>();
allProductIds.addAll(CLEANSER_PRODUCTS);
allProductIds.addAll(SERUM_PRODUCTS);
allProductIds.addAll(PREMIUM_PRODUCTS);
allProductIds.addAll(MAKEUP_PRODUCTS);
allProductIds.addAll(HAIR_PRODUCTS);

// Create missing PBEs
List<PricebookEntry> newPbes = new List<PricebookEntry>();
Map<Id, Decimal> productPrices = new Map<Id, Decimal>();
for (Product2 p : [SELECT Id, Price__c FROM Product2 WHERE Id IN :allProductIds]) {
    productPrices.put(p.Id, p.Price__c != null ? p.Price__c : 30);
}
for (Id pId : allProductIds) {
    if (!pbeCache.containsKey(pId)) {
        Decimal price = productPrices.containsKey(pId) ? productPrices.get(pId) : 30;
        newPbes.add(new PricebookEntry(Pricebook2Id=PRICEBOOK, Product2Id=pId, UnitPrice=price, IsActive=true));
    }
}
if (!newPbes.isEmpty()) {
    insert newPbes;
    for (PricebookEntry pbe : newPbes) {
        pbeCache.put(pbe.Product2Id, pbe.Id);
    }
}

// Build contact→account map for existing contacts
Map<Id, Id> contactAccountMap = new Map<Id, Id>();
for (Contact c : [SELECT Id, AccountId FROM Contact WHERE Id IN (:SARAH_CHEN, :JAMES_RODZ, :DAVID_KIM, :MAYA_THOMPSON, :MARCUS_WILLIAMS)]) {
    contactAccountMap.put(c.Id, c.AccountId);
}

// Define order scenarios: [ContactId, daysAgo, productIds, quantities]
// LAPSED VIP (old orders, no recent) — for winback
List<Map<String, Object>> orderDefs = new List<Map<String, Object>>();

// James Rodriguez (Platinum) — last purchase 400 days ago → WINBACK TARGET
orderDefs.add(new Map<String, Object>{'contact'=>JAMES_RODZ, 'account'=>contactAccountMap.get(JAMES_RODZ), 'daysAgo'=>400, 'products'=>PREMIUM_PRODUCTS, 'qty'=>2});
orderDefs.add(new Map<String, Object>{'contact'=>JAMES_RODZ, 'account'=>contactAccountMap.get(JAMES_RODZ), 'daysAgo'=>500, 'products'=>SERUM_PRODUCTS, 'qty'=>3});
orderDefs.add(new Map<String, Object>{'contact'=>JAMES_RODZ, 'account'=>contactAccountMap.get(JAMES_RODZ), 'daysAgo'=>620, 'products'=>MAKEUP_PRODUCTS, 'qty'=>2});

// Olivia Parker (Gold) — last purchase 380 days ago → WINBACK TARGET
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[0].Id, 'account'=>newAccounts[0].Id, 'daysAgo'=>380, 'products'=>PREMIUM_PRODUCTS, 'qty'=>1});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[0].Id, 'account'=>newAccounts[0].Id, 'daysAgo'=>450, 'products'=>SERUM_PRODUCTS, 'qty'=>2});

// Isabel Tanaka (Gold) — last purchase 390 days ago → WINBACK TARGET
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[7].Id, 'account'=>newAccounts[7].Id, 'daysAgo'=>390, 'products'=>PREMIUM_PRODUCTS, 'qty'=>2});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[7].Id, 'account'=>newAccounts[7].Id, 'daysAgo'=>520, 'products'=>HAIR_PRODUCTS, 'qty'=>3});

// Chloe Rivera (Platinum) — ACTIVE VIP, recent + old orders
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[1].Id, 'account'=>newAccounts[1].Id, 'daysAgo'=>5, 'products'=>PREMIUM_PRODUCTS, 'qty'=>2});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[1].Id, 'account'=>newAccounts[1].Id, 'daysAgo'=>30, 'products'=>SERUM_PRODUCTS, 'qty'=>1});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[1].Id, 'account'=>newAccounts[1].Id, 'daysAgo'=>90, 'products'=>MAKEUP_PRODUCTS, 'qty'=>3});

// Sarah Chen (Gold) — ACTIVE, recent orders
orderDefs.add(new Map<String, Object>{'contact'=>SARAH_CHEN, 'account'=>contactAccountMap.get(SARAH_CHEN), 'daysAgo'=>10, 'products'=>CLEANSER_PRODUCTS, 'qty'=>1});
orderDefs.add(new Map<String, Object>{'contact'=>SARAH_CHEN, 'account'=>contactAccountMap.get(SARAH_CHEN), 'daysAgo'=>45, 'products'=>SERUM_PRODUCTS, 'qty'=>2});

// Emma Lee (Gold) — ACTIVE, moderate orders
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[3].Id, 'account'=>newAccounts[3].Id, 'daysAgo'=>15, 'products'=>MAKEUP_PRODUCTS, 'qty'=>2});

// Aisha, Sophia, Priya, Zoe — regular customers, recent
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[2].Id, 'account'=>newAccounts[2].Id, 'daysAgo'=>3, 'products'=>CLEANSER_PRODUCTS, 'qty'=>1});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[4].Id, 'account'=>newAccounts[4].Id, 'daysAgo'=>7, 'products'=>HAIR_PRODUCTS, 'qty'=>1});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[5].Id, 'account'=>newAccounts[5].Id, 'daysAgo'=>12, 'products'=>CLEANSER_PRODUCTS, 'qty'=>2});
orderDefs.add(new Map<String, Object>{'contact'=>newContacts[6].Id, 'account'=>newAccounts[6].Id, 'daysAgo'=>2, 'products'=>MAKEUP_PRODUCTS, 'qty'=>1});

// David Kim (Silver) — moderate value
orderDefs.add(new Map<String, Object>{'contact'=>DAVID_KIM, 'account'=>contactAccountMap.get(DAVID_KIM), 'daysAgo'=>20, 'products'=>CLEANSER_PRODUCTS, 'qty'=>1});

Integer ordersCreated = 0;
for (Map<String, Object> def : orderDefs) {
    Id contactId = (Id) def.get('contact');
    Id accountId = (Id) def.get('account');
    Integer daysAgo = (Integer) def.get('daysAgo');
    List<Id> productIds = (List<Id>) def.get('products');
    Integer qty = (Integer) def.get('qty');

    try {
        // If we don't have the account ID, look it up from Contact
        if (accountId == null) {
            Contact c = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
            accountId = c.AccountId;
        }

        Order ord = new Order(
            AccountId = accountId,
            Pricebook2Id = PRICEBOOK,
            Status = 'Draft',
            EffectiveDate = Date.today().addDays(-daysAgo),
            Contact__c = contactId
        );
        insert ord;

        List<OrderItem> items = new List<OrderItem>();
        Decimal totalAmt = 0;
        for (Integer i = 0; i < Math.min(productIds.size(), qty + 1); i++) {
            Id prodId = productIds[Math.mod(i, productIds.size())];
            Id pbeId = pbeCache.get(prodId);
            if (pbeId == null) continue;
            Decimal price = productPrices.containsKey(prodId) ? productPrices.get(prodId) : 30;
            items.add(new OrderItem(OrderId=ord.Id, PricebookEntryId=pbeId, Quantity=1, UnitPrice=price));
            totalAmt += price;
        }
        if (!items.isEmpty()) {
            insert items;
        }

        ord.Status = 'Activated';
        update ord;
        ordersCreated++;
    } catch (Exception e) {
        System.debug(LoggingLevel.WARN, 'Order creation failed for ' + contactId + ': ' + e.getMessage());
    }
}
System.debug('Created ' + ordersCreated + ' orders');

// ─── 4. Seed browse sessions with UTM data ─────────────────────────────────
// Spread across recent days with various UTM sources to create trends

System.debug('=== Creating browse sessions ===');

// Collect all contact IDs
List<Id> allContacts = new List<Id>{
    SARAH_CHEN, JAMES_RODZ, DAVID_KIM, MAYA_THOMPSON, MARCUS_WILLIAMS
};
for (Contact c : newContacts) allContacts.add(c.Id);

// Product name lookup for browse tracking
Map<Id, String> productNames = new Map<Id, String>();
for (Product2 p : [SELECT Id, Name FROM Product2 WHERE Id IN :allProductIds]) {
    productNames.put(p.Id, p.Name);
}

// UTM sources with realistic distribution
List<Map<String, String>> utmConfigs = new List<Map<String, String>>{
    // TikTok — heavy recent spike (the scenario)
    new Map<String, String>{'source'=>'tiktok', 'medium'=>'paid_social', 'campaign'=>'glow-up-challenge-2026'},
    new Map<String, String>{'source'=>'tiktok', 'medium'=>'paid_social', 'campaign'=>'kbeauty-essentials-2026'},
    // Instagram — steady
    new Map<String, String>{'source'=>'instagram', 'medium'=>'paid_social', 'campaign'=>'summer-glow-2026'},
    new Map<String, String>{'source'=>'instagram', 'medium'=>'paid_social', 'campaign'=>'mens-skincare-starter-2026'},
    // Google — moderate
    new Map<String, String>{'source'=>'google', 'medium'=>'display', 'campaign'=>'retarget-cart-abandon'},
    new Map<String, String>{'source'=>'google', 'medium'=>'cpc', 'campaign'=>'brand-skincare-q1'},
    // Pinterest
    new Map<String, String>{'source'=>'pinterest', 'medium'=>'paid_social', 'campaign'=>'wedding-season-2026'},
    // Email/CRM
    new Map<String, String>{'source'=>'email', 'medium'=>'crm', 'campaign'=>'loyalty-double-points-feb'},
    // YouTube
    new Map<String, String>{'source'=>'youtube', 'medium'=>'video', 'campaign'=>'anti-aging-science-q1'}
};

// Category + product combinations for browse sessions
List<Map<String, String>> browseCombos = new List<Map<String, String>>{
    new Map<String, String>{'cats'=>'Cleansers;Skincare', 'prods'=>'Gentle Foaming Cleanser;Benzoyl Peroxide 2.5% Gel'},
    new Map<String, String>{'cats'=>'Serums;Anti-Aging', 'prods'=>'AHA/BHA Exfoliating Serum;Clarifying BHA Serum'},
    new Map<String, String>{'cats'=>'Moisturizers;Premium', 'prods'=>'Ultra Rich Barrier Cream;Gentle Eyes Sensitive Eye Cream'},
    new Map<String, String>{'cats'=>'Makeup;Foundation', 'prods'=>'Hydra Glow Primer;All-Day Waterproof Mascara;Dewy Liquid Blush'},
    new Map<String, String>{'cats'=>'Haircare', 'prods'=>'Thermal Shield Heat Protectant;Weekly Repair Hair Mask'},
    new Map<String, String>{'cats'=>'Cleansers;Acne', 'prods'=>'Benzoyl Peroxide 2.5% Gel;AHA/BHA Exfoliating Serum'},
    new Map<String, String>{'cats'=>'Skincare;Serums;Anti-Aging', 'prods'=>'Glycolic Acid 10% Peel Pads;Enzyme Renewal Mask'},
    new Map<String, String>{'cats'=>'Makeup;Eyes', 'prods'=>'All-Day Waterproof Mascara;Micro Brow Pencil'}
};

List<Browse_Session__c> browseSessions = new List<Browse_Session__c>();

// Recent period (last 7 days) — heavy TikTok traffic for the spike scenario
for (Integer day = 0; day < 7; day++) {
    Date sessionDate = Date.today().addDays(-day);

    // TikTok sessions — 8-12 per day (spike)
    for (Integer i = 0; i < 8 + Math.mod(day * 3, 5); i++) {
        Integer contactIdx = Math.mod(i + day, allContacts.size());
        Integer utmIdx = Math.mod(i, 2); // Alternate between 2 TikTok campaigns
        Integer browseIdx = Math.mod(i + day, browseCombos.size());

        // TikTok visitors trend heavily toward cleansers
        if (i < 5) browseIdx = 0; // Cleansers
        else if (i < 7) browseIdx = 5; // Cleansers+Acne

        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = allContacts[contactIdx],
            Session_Date__c = sessionDate,
            Categories_Browsed__c = browseCombos[browseIdx].get('cats'),
            Products_Viewed__c = browseCombos[browseIdx].get('prods'),
            Duration_Minutes__c = 3 + Math.mod(i * 7, 12),
            Device__c = Math.mod(i, 3) == 0 ? 'mobile' : 'desktop',
            UTM_Source__c = utmConfigs[utmIdx].get('source'),
            UTM_Medium__c = utmConfigs[utmIdx].get('medium'),
            UTM_Campaign__c = utmConfigs[utmIdx].get('campaign')
        ));
    }

    // Instagram sessions — 3-5 per day (steady)
    for (Integer i = 0; i < 3 + Math.mod(day, 3); i++) {
        Integer contactIdx = Math.mod(i + day + 3, allContacts.size());
        Integer browseIdx = Math.mod(i, browseCombos.size());
        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = allContacts[contactIdx],
            Session_Date__c = sessionDate,
            Categories_Browsed__c = browseCombos[browseIdx].get('cats'),
            Products_Viewed__c = browseCombos[browseIdx].get('prods'),
            Duration_Minutes__c = 4 + Math.mod(i * 5, 10),
            Device__c = 'mobile',
            UTM_Source__c = utmConfigs[2 + Math.mod(i, 2)].get('source'),
            UTM_Medium__c = utmConfigs[2 + Math.mod(i, 2)].get('medium'),
            UTM_Campaign__c = utmConfigs[2 + Math.mod(i, 2)].get('campaign')
        ));
    }

    // Google, Pinterest, Email — 1-3 per day each
    for (Integer srcIdx = 4; srcIdx < utmConfigs.size(); srcIdx++) {
        Integer count = 1 + Math.mod(day + srcIdx, 3);
        for (Integer i = 0; i < count; i++) {
            Integer contactIdx = Math.mod(srcIdx + i + day, allContacts.size());
            Integer browseIdx = Math.mod(srcIdx + i, browseCombos.size());
            browseSessions.add(new Browse_Session__c(
                Customer_Id__c = allContacts[contactIdx],
                Session_Date__c = sessionDate,
                Categories_Browsed__c = browseCombos[browseIdx].get('cats'),
                Products_Viewed__c = browseCombos[browseIdx].get('prods'),
                Duration_Minutes__c = 2 + Math.mod(srcIdx * 3 + i, 15),
                Device__c = Math.mod(i, 2) == 0 ? 'desktop' : 'mobile',
                UTM_Source__c = utmConfigs[srcIdx].get('source'),
                UTM_Medium__c = utmConfigs[srcIdx].get('medium'),
                UTM_Campaign__c = utmConfigs[srcIdx].get('campaign')
            ));
        }
    }
}

// Prior period (8-14 days ago) — LOWER TikTok traffic (to show the spike)
for (Integer day = 7; day < 14; day++) {
    Date sessionDate = Date.today().addDays(-day);

    // TikTok — only 2-3 per day in prior period
    for (Integer i = 0; i < 2 + Math.mod(day, 2); i++) {
        Integer contactIdx = Math.mod(i + day, allContacts.size());
        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = allContacts[contactIdx],
            Session_Date__c = sessionDate,
            Categories_Browsed__c = 'Makeup;Foundation',
            Products_Viewed__c = 'Hydra Glow Primer;Dewy Liquid Blush',
            Duration_Minutes__c = 3 + Math.mod(i, 5),
            Device__c = 'mobile',
            UTM_Source__c = 'tiktok',
            UTM_Medium__c = 'paid_social',
            UTM_Campaign__c = 'glow-up-challenge-2026'
        ));
    }

    // Instagram — 3 per day in prior period (same as now = steady)
    for (Integer i = 0; i < 3; i++) {
        Integer contactIdx = Math.mod(i + day + 5, allContacts.size());
        Integer browseIdx = Math.mod(i + day, browseCombos.size());
        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = allContacts[contactIdx],
            Session_Date__c = sessionDate,
            Categories_Browsed__c = browseCombos[browseIdx].get('cats'),
            Products_Viewed__c = browseCombos[browseIdx].get('prods'),
            Duration_Minutes__c = 4 + Math.mod(i, 8),
            Device__c = 'mobile',
            UTM_Source__c = 'instagram',
            UTM_Medium__c = 'paid_social',
            UTM_Campaign__c = 'summer-glow-2026'
        ));
    }

    // Other sources — 1-2 each
    for (Integer srcIdx = 4; srcIdx < utmConfigs.size(); srcIdx++) {
        Integer contactIdx = Math.mod(srcIdx + day, allContacts.size());
        Integer browseIdx = Math.mod(srcIdx + day, browseCombos.size());
        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = allContacts[contactIdx],
            Session_Date__c = sessionDate,
            Categories_Browsed__c = browseCombos[browseIdx].get('cats'),
            Products_Viewed__c = browseCombos[browseIdx].get('prods'),
            Duration_Minutes__c = 2 + Math.mod(srcIdx, 10),
            Device__c = 'desktop',
            UTM_Source__c = utmConfigs[srcIdx].get('source'),
            UTM_Medium__c = utmConfigs[srcIdx].get('medium'),
            UTM_Campaign__c = utmConfigs[srcIdx].get('campaign')
        ));
    }
}

// VIP-specific premium product browsing (for segment contrast)
// Gold/Platinum members browse premium products recently
for (Integer day = 0; day < 5; day++) {
    Date sessionDate = Date.today().addDays(-day);
    // Sarah (Gold), Chloe (Platinum), Emma (Gold) browse premium
    List<Id> vipContacts = new List<Id>{SARAH_CHEN, newContacts[1].Id, newContacts[3].Id};
    for (Id vipId : vipContacts) {
        browseSessions.add(new Browse_Session__c(
            Customer_Id__c = vipId,
            Session_Date__c = sessionDate,
            Categories_Browsed__c = 'Premium;Skincare;Anti-Aging',
            Products_Viewed__c = 'Ultra Rich Barrier Cream;Glycolic Acid 10% Peel Pads;Gentle Eyes Sensitive Eye Cream',
            Duration_Minutes__c = 8 + Math.mod(day * 3, 7),
            Device__c = 'desktop',
            UTM_Source__c = Math.mod(day, 2) == 0 ? 'tiktok' : 'google',
            UTM_Medium__c = Math.mod(day, 2) == 0 ? 'paid_social' : 'cpc',
            UTM_Campaign__c = Math.mod(day, 2) == 0 ? 'glow-up-challenge-2026' : 'brand-skincare-q1'
        ));
    }
}

insert browseSessions;
System.debug('Created ' + browseSessions.size() + ' browse sessions');

// ─── 5. Seed meaningful events for journey processing ───────────────────────

System.debug('=== Creating meaningful events ===');

List<Meaningful_Event__c> events = new List<Meaningful_Event__c>{
    new Meaningful_Event__c(
        Contact__c = newContacts[2].Id,  // Aisha
        Customer_Id__c = String.valueOf(newContacts[2].Id),
        Event_Type__c = 'birthday',
        Description__c = 'Customer mentioned birthday is in 3 weeks. Interested in treating herself to a skincare upgrade.',
        Relative_Time_Text__c = 'in three weeks',
        Urgency__c = 'This Month',
        Approval_Status__c = 'Pending Review',
        Captured_At__c = Datetime.now()
    ),
    new Meaningful_Event__c(
        Contact__c = newContacts[4].Id,  // Sophia
        Customer_Id__c = String.valueOf(newContacts[4].Id),
        Event_Type__c = 'wedding',
        Description__c = 'Getting married next month! Looking for a complete bridal beauty routine.',
        Relative_Time_Text__c = 'next month',
        Urgency__c = 'This Month',
        Approval_Status__c = 'Pending Review',
        Captured_At__c = Datetime.now()
    ),
    new Meaningful_Event__c(
        Contact__c = newContacts[5].Id,  // Priya
        Customer_Id__c = String.valueOf(newContacts[5].Id),
        Event_Type__c = 'travel',
        Description__c = 'Planning a beach vacation in 2 weeks. Needs SPF and travel-size skincare.',
        Relative_Time_Text__c = 'in two weeks',
        Urgency__c = 'This Month',
        Approval_Status__c = 'Pending Review',
        Captured_At__c = Datetime.now()
    )
};
insert events;
System.debug('Created ' + events.size() + ' meaningful events');

// ─── 6. Summary ─────────────────────────────────────────────────────────────

System.debug('\n========================================');
System.debug('SEED DATA SUMMARY');
System.debug('========================================');
System.debug('New contacts: ' + newContacts.size());
System.debug('Loyalty members enrolled: ' + newMembers.size());
System.debug('Tier assignments: ' + tierAssignments.size());
System.debug('Orders created: ' + ordersCreated);
System.debug('Browse sessions: ' + browseSessions.size());
System.debug('Meaningful events: ' + events.size());
System.debug('');
System.debug('WINBACK TARGETS (VIP, no purchase >365 days):');
System.debug('  - James Rodriguez (Platinum) — last purchase ~400 days ago');
System.debug('  - Olivia Parker (Gold) — last purchase ~380 days ago');
System.debug('  - Isabel Tanaka (Gold) — last purchase ~390 days ago');
System.debug('');
System.debug('TIKTOK SPIKE SCENARIO:');
System.debug('  - Recent 7 days: ~70+ TikTok sessions (heavy cleanser browsing)');
System.debug('  - Prior 7 days: ~18 TikTok sessions');
System.debug('  - Expected spike: ~280% increase');
System.debug('  - VIP visitors browsing premium products via TikTok');
System.debug('========================================');
