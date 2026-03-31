// Step 3: Browse sessions (UTM data) + meaningful events

List<Id> allContacts = new List<Id>{
    '003Ka00003xPazzIAC', '003Ka00003xPb04IAC', '003Ka00003xPazbIAC',
    '003Ka00003xPb09IAC', '003Ka00003xPb0EIAS',
    '003Ka000042yjY6IAI', '003Ka000042yjY7IAI', '003Ka000042yjY8IAI',
    '003Ka000042yjY9IAI', '003Ka000042yjYAIAY', '003Ka000042yjYBIAY',
    '003Ka000042yjYCIAY', '003Ka000042yjYDIAY'
};

// UTM configs
List<List<String>> utms = new List<List<String>>{
    new List<String>{'tiktok','paid_social','glow-up-challenge-2026'},
    new List<String>{'tiktok','paid_social','kbeauty-essentials-2026'},
    new List<String>{'instagram','paid_social','summer-glow-2026'},
    new List<String>{'instagram','paid_social','mens-skincare-starter-2026'},
    new List<String>{'google','display','retarget-cart-abandon'},
    new List<String>{'google','cpc','brand-skincare-q1'},
    new List<String>{'pinterest','paid_social','wedding-season-2026'},
    new List<String>{'email','crm','loyalty-double-points-feb'},
    new List<String>{'youtube','video','anti-aging-science-q1'}
};

// Browse combos: categories | products
List<List<String>> combos = new List<List<String>>{
    new List<String>{'Cleansers;Skincare','Gentle Foaming Cleanser;Benzoyl Peroxide 2.5% Gel'},
    new List<String>{'Serums;Anti-Aging','AHA/BHA Exfoliating Serum;Clarifying BHA Serum'},
    new List<String>{'Moisturizers;Premium','Ultra Rich Barrier Cream;Gentle Eyes Sensitive Eye Cream'},
    new List<String>{'Makeup;Foundation','Hydra Glow Primer;All-Day Waterproof Mascara;Dewy Liquid Blush'},
    new List<String>{'Haircare','Thermal Shield Heat Protectant;Weekly Repair Hair Mask'},
    new List<String>{'Cleansers;Acne','Benzoyl Peroxide 2.5% Gel;AHA/BHA Exfoliating Serum'},
    new List<String>{'Skincare;Serums;Anti-Aging','Glycolic Acid 10% Peel Pads;Enzyme Renewal Mask'},
    new List<String>{'Makeup;Eyes','All-Day Waterproof Mascara;Micro Brow Pencil'}
};

List<Browse_Session__c> sessions = new List<Browse_Session__c>();

// Recent 7 days — heavy TikTok spike
for (Integer day = 0; day < 7; day++) {
    Date d = Date.today().addDays(-day);
    // TikTok: 8-12 per day, heavy cleanser
    for (Integer i = 0; i < 8 + Math.mod(day * 3, 5); i++) {
        Integer ci = Math.mod(i + day, allContacts.size());
        Integer bi = i < 5 ? 0 : (i < 7 ? 5 : Math.mod(i, combos.size())); // cleansers heavy
        Integer ui = Math.mod(i, 2);
        sessions.add(new Browse_Session__c(
            Customer_Id__c=allContacts[ci], Session_Date__c=d,
            Categories_Browsed__c=combos[bi][0], Products_Viewed__c=combos[bi][1],
            Duration_Minutes__c=3+Math.mod(i*7,12), Device__c=Math.mod(i,3)==0?'mobile':'desktop',
            UTM_Source__c=utms[ui][0], UTM_Medium__c=utms[ui][1], UTM_Campaign__c=utms[ui][2]
        ));
    }
    // Instagram: 3-5 per day
    for (Integer i = 0; i < 3 + Math.mod(day, 3); i++) {
        Integer ci = Math.mod(i + day + 3, allContacts.size());
        Integer bi = Math.mod(i + day, combos.size());
        sessions.add(new Browse_Session__c(
            Customer_Id__c=allContacts[ci], Session_Date__c=d,
            Categories_Browsed__c=combos[bi][0], Products_Viewed__c=combos[bi][1],
            Duration_Minutes__c=4+Math.mod(i*5,10), Device__c='mobile',
            UTM_Source__c=utms[2+Math.mod(i,2)][0], UTM_Medium__c=utms[2+Math.mod(i,2)][1], UTM_Campaign__c=utms[2+Math.mod(i,2)][2]
        ));
    }
    // Other sources: 1-2 each
    for (Integer s = 4; s < utms.size(); s++) {
        Integer cnt = 1 + Math.mod(day + s, 3);
        for (Integer i = 0; i < cnt; i++) {
            Integer ci = Math.mod(s + i + day, allContacts.size());
            Integer bi = Math.mod(s + i, combos.size());
            sessions.add(new Browse_Session__c(
                Customer_Id__c=allContacts[ci], Session_Date__c=d,
                Categories_Browsed__c=combos[bi][0], Products_Viewed__c=combos[bi][1],
                Duration_Minutes__c=2+Math.mod(s*3+i,15), Device__c=Math.mod(i,2)==0?'desktop':'mobile',
                UTM_Source__c=utms[s][0], UTM_Medium__c=utms[s][1], UTM_Campaign__c=utms[s][2]
            ));
        }
    }
}

// Prior period (8-14 days) — LOW TikTok (creates spike contrast)
for (Integer day = 7; day < 14; day++) {
    Date d = Date.today().addDays(-day);
    // TikTok: only 2-3 per day
    for (Integer i = 0; i < 2 + Math.mod(day, 2); i++) {
        Integer ci = Math.mod(i + day, allContacts.size());
        sessions.add(new Browse_Session__c(
            Customer_Id__c=allContacts[ci], Session_Date__c=d,
            Categories_Browsed__c='Makeup;Foundation', Products_Viewed__c='Hydra Glow Primer;Dewy Liquid Blush',
            Duration_Minutes__c=3+Math.mod(i,5), Device__c='mobile',
            UTM_Source__c='tiktok', UTM_Medium__c='paid_social', UTM_Campaign__c='glow-up-challenge-2026'
        ));
    }
    // Instagram: 3 per day (steady)
    for (Integer i = 0; i < 3; i++) {
        Integer ci = Math.mod(i + day + 5, allContacts.size());
        Integer bi = Math.mod(i + day, combos.size());
        sessions.add(new Browse_Session__c(
            Customer_Id__c=allContacts[ci], Session_Date__c=d,
            Categories_Browsed__c=combos[bi][0], Products_Viewed__c=combos[bi][1],
            Duration_Minutes__c=4+Math.mod(i,8), Device__c='mobile',
            UTM_Source__c='instagram', UTM_Medium__c='paid_social', UTM_Campaign__c='summer-glow-2026'
        ));
    }
    // Other sources: 1 each
    for (Integer s = 4; s < utms.size(); s++) {
        Integer ci = Math.mod(s + day, allContacts.size());
        Integer bi = Math.mod(s + day, combos.size());
        sessions.add(new Browse_Session__c(
            Customer_Id__c=allContacts[ci], Session_Date__c=d,
            Categories_Browsed__c=combos[bi][0], Products_Viewed__c=combos[bi][1],
            Duration_Minutes__c=2+Math.mod(s,10), Device__c='desktop',
            UTM_Source__c=utms[s][0], UTM_Medium__c=utms[s][1], UTM_Campaign__c=utms[s][2]
        ));
    }
}

// VIP premium browsing (Gold/Plat members on premium products via TikTok)
List<Id> vipIds = new List<Id>{'003Ka00003xPazzIAC','003Ka000042yjY7IAI','003Ka000042yjY9IAI'};
for (Integer day = 0; day < 5; day++) {
    for (Id vId : vipIds) {
        sessions.add(new Browse_Session__c(
            Customer_Id__c=vId, Session_Date__c=Date.today().addDays(-day),
            Categories_Browsed__c='Premium;Skincare;Anti-Aging',
            Products_Viewed__c='Ultra Rich Barrier Cream;Glycolic Acid 10% Peel Pads;Gentle Eyes Sensitive Eye Cream',
            Duration_Minutes__c=8+Math.mod(day*3,7), Device__c='desktop',
            UTM_Source__c=Math.mod(day,2)==0?'tiktok':'google',
            UTM_Medium__c=Math.mod(day,2)==0?'paid_social':'cpc',
            UTM_Campaign__c=Math.mod(day,2)==0?'glow-up-challenge-2026':'brand-skincare-q1'
        ));
    }
}

insert sessions;
System.debug('Browse sessions created: ' + sessions.size());

// ─── Meaningful Events ──────────────────────────────────────────────────────

List<Meaningful_Event__c> events = new List<Meaningful_Event__c>{
    new Meaningful_Event__c(
        Contact__c='003Ka000042yjY8IAI', Customer_Id__c='003Ka000042yjY8IAI',
        Event_Type__c='birthday', Description__c='Customer mentioned birthday is in 3 weeks. Interested in treating herself to a skincare upgrade.',
        Relative_Time_Text__c='in three weeks', Urgency__c='This Month',
        Approval_Status__c='Pending Review', Captured_At__c=Datetime.now()
    ),
    new Meaningful_Event__c(
        Contact__c='003Ka000042yjYAIAY', Customer_Id__c='003Ka000042yjYAIAY',
        Event_Type__c='wedding', Description__c='Getting married next month! Looking for a complete bridal beauty routine.',
        Relative_Time_Text__c='next month', Urgency__c='This Month',
        Approval_Status__c='Pending Review', Captured_At__c=Datetime.now()
    ),
    new Meaningful_Event__c(
        Contact__c='003Ka000042yjYBIAY', Customer_Id__c='003Ka000042yjYBIAY',
        Event_Type__c='travel', Description__c='Planning a beach vacation in 2 weeks. Needs SPF and travel-size skincare.',
        Relative_Time_Text__c='in two weeks', Urgency__c='This Month',
        Approval_Status__c='Pending Review', Captured_At__c=Datetime.now()
    )
};
insert events;
System.debug('Events created: ' + events.size());

System.debug('');
System.debug('========== SEED COMPLETE ==========');
System.debug('Browse sessions: ' + sessions.size());
System.debug('Meaningful events: ' + events.size());
System.debug('TikTok spike: ~70 recent vs ~18 prior (est ~280% increase)');
System.debug('VIP premium browsing: 15 sessions');
System.debug('====================================');
