/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Partner Advantage Program — B2B Loyalty Program Setup
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 3-Tier B2B program for distributor/reseller partners:
 *
 *   Tier            Min QP/Year   Annual Spend Equiv.   Rebate
 *   ─────────────── ──────────── ─────────────────────  ──────
 *   Bronze Partner        0        < $50,000             1 %
 *   Silver Partner    5,000        $50,000 – $149,999    2 %
 *   Gold Partner     15,000        $150,000 +            3 %
 *
 * Earning rate: 10 qualifying points per $100 spent
 * QP reset: annually on membership anniversary (Anniversary model)
 *
 * Benefits (13 total, cumulative per tier):
 *   Bronze (4): Partner Portal, Standard SLA, Quarterly Newsletter, Co-marketing
 *   Silver +5:  Partner Success Manager, Priority SLA, Monthly Webinars,
 *               2% Volume Rebate, Early Product Access
 *   Gold   +4:  Executive Sponsor, Same-Day SLA, Custom Pricing, QBR,
 *               Beta Access, Partner Summit, 3% Volume Rebate (replaces Silver)
 *
 * Promotions (3):
 *   1. New Partner Onboarding Bonus — 3× points, first 90 days
 *   2. Q4 Growth Accelerator       — 2× points on orders ≥ $10 K, Oct–Dec
 *   3. Product Expansion Bonus     — 500 bonus pts per new product category
 *
 * Process Rules (4):
 *   1. Standard Earning Rule       — 10 pts per $100 (1 pt per $10)
 *   2. Tier Upgrade Rule           — auto-promote when QP threshold crossed
 *   3. Annual Tier Review Rule     — evaluate & adjust tier on anniversary
 *   4. Welcome Bonus Rule          — award 500 pts on enrollment
 *
 * Run:
 *   sf apex run --file salesforce/scripts/setup-b2b-loyalty-program.apex -o my-org
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

final String PROGRAM_NAME    = 'Partner Advantage Program';
final String TIER_GROUP_NAME = 'Partner Advantage Tiers';
final String CURRENCY_NAME   = 'Partner Points';

// { Name, SequenceNumber, MinQualifyingPoints }
final List<Object[]> TIER_DEFS = new List<Object[]>{
    new Object[]{ 'Bronze Partner', 1,     0 },
    new Object[]{ 'Silver Partner', 2,  5000 },
    new Object[]{ 'Gold Partner',   3, 15000 }
};

// Benefits: { TierName, BenefitName, Description, IsNewInThisTier }
// IsNewInThisTier = true means the benefit is introduced at that tier level
final List<Object[]> BENEFIT_DEFS = new List<Object[]>{
    // ── Bronze Partner benefits ──────────────────────────────────────────────
    new Object[]{ 'Bronze Partner', 'Partner Portal Access',
        'Full access to the Partner Portal: product catalog, training materials, sales collateral, and deal registration tools.',
        true },
    new Object[]{ 'Bronze Partner', 'Standard Support SLA',
        '48-hour response SLA with dedicated partner support queue. Email and chat support channels included.',
        true },
    new Object[]{ 'Bronze Partner', 'Quarterly Partner Newsletter',
        'Quarterly newsletter with product roadmap updates, industry insights, competitive intelligence, and promotional calendars.',
        true },
    new Object[]{ 'Bronze Partner', 'Co-Marketing Opportunities',
        'Access to co-branded marketing templates, joint press release templates, and listing on the partner directory.',
        true },

    // ── Silver Partner benefits (+ all Bronze) ───────────────────────────────
    new Object[]{ 'Silver Partner', 'Dedicated Partner Success Manager',
        'Named Partner Success Manager assigned to your account for strategic planning, quarterly check-ins, and escalation support.',
        true },
    new Object[]{ 'Silver Partner', 'Priority Support SLA',
        'Upgraded to 24-hour response SLA with phone support and direct access to Tier-2 technical specialists.',
        true },
    new Object[]{ 'Silver Partner', 'Monthly Partner Webinars & Training',
        'Invitation-only monthly live training webinars covering new products, sales techniques, and technical deep-dives.',
        true },
    new Object[]{ 'Silver Partner', '2% Volume Rebate',
        'Earn a 2% quarterly volume rebate on all qualifying net sales. Rebate is paid within 30 days of quarter close.',
        true },
    new Object[]{ 'Silver Partner', 'Early Product Access',
        'Receive advance notice and sample access to new product launches 30 days before general availability.',
        true },

    // ── Gold Partner benefits (+ all Silver) ─────────────────────────────────
    new Object[]{ 'Gold Partner', 'Executive Sponsor Assignment',
        'A named executive sponsor (VP or above) assigned to champion your partnership internally and attend strategic meetings.',
        true },
    new Object[]{ 'Gold Partner', 'Same-Day Premium Support SLA',
        '2-hour initial response SLA with a dedicated 24/7 hotline. Critical issues handled by a senior engineering team.',
        true },
    new Object[]{ 'Gold Partner', 'Custom Pricing & Terms',
        'Ability to negotiate custom pricing tiers, payment terms, and volume commitments tailored to your business model.',
        true },
    new Object[]{ 'Gold Partner', 'Quarterly Business Review (QBR)',
        'Formal QBR sessions with executive leadership to review performance, set joint goals, and align on strategic initiatives.',
        true },
    new Object[]{ 'Gold Partner', 'Beta Product & Co-Innovation Access',
        'Seat on the Partner Advisory Council with access to beta products, roadmap input sessions, and co-development opportunities.',
        true },
    new Object[]{ 'Gold Partner', 'Exclusive Partner Summit Invitation',
        'Annual all-expenses-paid invitation to the Partner Summit for networking, product previews, and executive keynotes.',
        true },
    new Object[]{ 'Gold Partner', '3% Volume Rebate',
        'Upgraded to a 3% quarterly volume rebate on all qualifying net sales, replacing the Silver-tier 2% rebate.',
        true }
};

// Promotion definitions: { Name, Type, StartDate, EndDate, Description }
final Date TODAY = Date.today();
final List<Object[]> PROMOTION_DEFS = new List<Object[]>{
    new Object[]{
        'New Partner Onboarding Bonus',
        'StandardPromotion',
        TODAY,
        TODAY.addYears(5),   // ongoing — rolling 90-day window enforced by process rule
        '3× qualifying points on all purchases made within the first 90 days of program enrollment. ' +
        'Automatically applied at transaction time. Maximum 15,000 bonus points.'
    },
    new Object[]{
        'Q4 Growth Accelerator',
        'StandardPromotion',
        Date.newInstance(TODAY.year(), 10, 1),   // Oct 1
        Date.newInstance(TODAY.year(), 12, 31),  // Dec 31
        '2× qualifying points on any single order of $10,000 or more placed during Q4 (October–December). ' +
        'Stackable with tier multipliers. Designed to reward year-end volume commitment.'
    },
    new Object[]{
        'Product Expansion Bonus',
        'StandardPromotion',
        TODAY,
        TODAY.addYears(3),
        '500 bonus qualifying points awarded the first time a partner places an order in a new product category. ' +
        'Each category can only be claimed once per membership year. Up to 10 categories eligible per year (5,000 pts max).'
    }
};

// Process rule definitions: { Name, RuleType, ExecutionOrder, Description }
final List<Object[]> PROCESS_RULE_DEFS = new List<Object[]>{
    new Object[]{
        'Standard Earning — 10 pts per $100',
        'Accrual',
        10,
        'Awards 10 qualifying Partner Points for every $100 (or part thereof) of eligible net purchase value. ' +
        'Excludes taxes, shipping, and previously returned items. Applied to all active Silver and Gold partners automatically.'
    },
    new Object[]{
        'Tier Upgrade Rule',
        'TierChange',
        20,
        'Automatically evaluates a member\'s cumulative qualifying points against tier thresholds after each qualifying transaction. ' +
        'Upgrades member to the next tier (Bronze→Silver at 5,000 QP; Silver→Gold at 15,000 QP) effective immediately. ' +
        'An upgrade notification email is triggered and a one-time upgrade bonus is credited (see Welcome & Upgrade Bonus rule).'
    },
    new Object[]{
        'Annual Tier Review Rule',
        'TierChange',
        30,
        'On each member\'s program anniversary date, evaluates the prior 12 months of qualifying points. ' +
        'If points fall below the current tier minimum, the member is downgraded one tier. ' +
        'A 60-day advance warning notification is sent before any downgrade takes effect, giving partners time to close deals.'
    },
    new Object[]{
        'Welcome & Upgrade Bonus',
        'Accrual',
        40,
        'Awards one-time bonus points at key milestones: ' +
        '(1) 500 qualifying points upon initial program enrollment; ' +
        '(2) 1,000 qualifying points upon upgrade to Silver Partner tier; ' +
        '(3) 2,500 qualifying points upon upgrade to Gold Partner tier. ' +
        'Bonuses are credited within 24 hours of the triggering event.'
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: LOYALTY PROGRAM
// ─────────────────────────────────────────────────────────────────────────────

System.debug('');
System.debug('╔═══════════════════════════════════════════════════════════╗');
System.debug('║   Partner Advantage Program — B2B Loyalty Setup           ║');
System.debug('╚═══════════════════════════════════════════════════════════╝');
System.debug('');
System.debug('── STEP 1: Loyalty Program ──────────────────────────────────');

LoyaltyProgram prog;
List<LoyaltyProgram> existingProgs = [
    SELECT Id, Name, Status FROM LoyaltyProgram WHERE Name = :PROGRAM_NAME LIMIT 1
];
if (existingProgs.isEmpty()) {
    prog = new LoyaltyProgram(Name = PROGRAM_NAME, Status = 'Active');
    insert prog;
    System.debug('✓ Created: ' + PROGRAM_NAME + ' [' + prog.Id + ']');
} else {
    prog = existingProgs[0];
    System.debug('✓ Exists:  ' + PROGRAM_NAME + ' [' + prog.Id + '] (Status: ' + prog.Status + ')');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: TIER GROUP
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 2: Tier Group ───────────────────────────────────────');

LoyaltyTierGroup tierGroup;
List<LoyaltyTierGroup> existingGroups = [
    SELECT Id, Name, IsActive FROM LoyaltyTierGroup
    WHERE LoyaltyProgramId = :prog.Id AND Name = :TIER_GROUP_NAME LIMIT 1
];
if (existingGroups.isEmpty()) {
    tierGroup = new LoyaltyTierGroup(
        Name             = TIER_GROUP_NAME,
        LoyaltyProgramId = prog.Id,
        IsActive         = true,
        TierModel        = 'Anniversary',   // rolling 12-month window per member
        QpResetPeriod    = 'Years',
        QpResetFrequency = 1
    );
    insert tierGroup;
    System.debug('✓ Created: ' + TIER_GROUP_NAME + ' [' + tierGroup.Id + ']');
} else {
    tierGroup = existingGroups[0];
    System.debug('✓ Exists:  ' + TIER_GROUP_NAME + ' [' + tierGroup.Id + ']');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: TIERS
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 3: Tiers ────────────────────────────────────────────');

Map<String, LoyaltyTier> existingTiers = new Map<String, LoyaltyTier>();
for (LoyaltyTier t : [SELECT Id, Name FROM LoyaltyTier WHERE LoyaltyTierGroupId = :tierGroup.Id]) {
    existingTiers.put(t.Name, t);
}

List<LoyaltyTier> tiersToInsert = new List<LoyaltyTier>();
for (Object[] def : TIER_DEFS) {
    String tierName = (String)def[0];
    Integer seq     = (Integer)def[1];
    if (!existingTiers.containsKey(tierName)) {
        tiersToInsert.add(new LoyaltyTier(
            Name               = tierName,
            LoyaltyTierGroupId = tierGroup.Id,
            SequenceNumber     = seq
        ));
    } else {
        System.debug('✓ Exists:  ' + tierName);
    }
}
if (!tiersToInsert.isEmpty()) {
    insert tiersToInsert;
    for (LoyaltyTier t : tiersToInsert) {
        System.debug('✓ Created: ' + t.Name + ' [' + t.Id + ']');
    }
}

// Refresh tier map
Map<String, Id> tierIdByName = new Map<String, Id>();
for (LoyaltyTier t : [SELECT Id, Name, SequenceNumber FROM LoyaltyTier WHERE LoyaltyTierGroupId = :tierGroup.Id ORDER BY SequenceNumber]) {
    tierIdByName.put(t.Name, t.Id);
    System.debug('  • ' + t.Name + ' (seq=' + t.SequenceNumber + '): ' + t.Id);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: PROGRAM CURRENCY
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 4: Program Currency ─────────────────────────────────');

LoyaltyProgramCurrency progCurrency;
List<LoyaltyProgramCurrency> existingCurrencies = [
    SELECT Id, Name, CurrencyType FROM LoyaltyProgramCurrency
    WHERE LoyaltyProgramId = :prog.Id AND Name = :CURRENCY_NAME LIMIT 1
];
if (existingCurrencies.isEmpty()) {
    progCurrency = new LoyaltyProgramCurrency(
        Name               = CURRENCY_NAME,
        LoyaltyProgramId   = prog.Id,
        LoyaltyTierGroupId = tierGroup.Id,
        CurrencyType       = 'Qualifying',   // counts toward tier status
        IsActive           = true
    );
    insert progCurrency;
    System.debug('✓ Created: ' + CURRENCY_NAME + ' [' + progCurrency.Id + '] (Qualifying)');
} else {
    progCurrency = existingCurrencies[0];
    System.debug('✓ Exists:  ' + CURRENCY_NAME + ' [' + progCurrency.Id + '] (' + progCurrency.CurrencyType + ')');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: BENEFITS
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 5: Benefits (13 total) ──────────────────────────────');

Boolean hasBenefitType   = Schema.getGlobalDescribe().containsKey('LoyaltyBenefitType');
Boolean hasTierBenefit   = Schema.getGlobalDescribe().containsKey('LoyaltyTierBenefit');

if (hasBenefitType && hasTierBenefit) {
    // ── Query existing benefit types for this program ──────────────────────
    Map<String, SObject> existingBenefits = new Map<String, SObject>();
    String benefitQuery = 'SELECT Id, Name FROM LoyaltyBenefitType WHERE LoyaltyProgramId = \'' + prog.Id + '\'';
    for (SObject bt : Database.query(benefitQuery)) {
        existingBenefits.put((String)bt.get('Name'), bt);
    }

    List<SObject> benefitsToInsert = new List<SObject>();
    for (Object[] def : BENEFIT_DEFS) {
        String benefitName = (String)def[1];
        String description = (String)def[2];
        if (!existingBenefits.containsKey(benefitName)) {
            SObject bt = (SObject)Type.forName('LoyaltyBenefitType').newInstance();
            bt.put('Name',             benefitName);
            bt.put('LoyaltyProgramId', prog.Id);
            bt.put('Description',      description);
            bt.put('IsActive',         true);
            benefitsToInsert.add(bt);
        } else {
            System.debug('✓ Benefit exists:  ' + benefitName);
        }
    }
    if (!benefitsToInsert.isEmpty()) {
        insert benefitsToInsert;
        System.debug('✓ Created ' + benefitsToInsert.size() + ' benefit types');
    }

    // Refresh benefit map
    Map<String, Id> benefitIdByName = new Map<String, Id>();
    for (SObject bt : Database.query(benefitQuery)) {
        benefitIdByName.put((String)bt.get('Name'), (Id)bt.get('Id'));
    }

    // ── Link benefits to tiers via LoyaltyTierBenefit ─────────────────────
    Map<String, Set<String>> existingTierBenefits = new Map<String, Set<String>>();
    String tierBenefitQuery = 'SELECT Id, LoyaltyTierId, LoyaltyBenefitTypeId FROM LoyaltyTierBenefit';
    for (SObject tb : Database.query(tierBenefitQuery)) {
        Id tierId = (Id)tb.get('LoyaltyTierId');
        Id btId   = (Id)tb.get('LoyaltyBenefitTypeId');
        if (!existingTierBenefits.containsKey(tierId)) {
            existingTierBenefits.put(tierId, new Set<String>());
        }
        existingTierBenefits.get(tierId).add(btId);
    }

    List<SObject> tierBenefitsToInsert = new List<SObject>();
    // Each benefit is assigned to its intro tier AND all higher tiers (cumulative)
    List<String> tierOrder = new List<String>{ 'Bronze Partner', 'Silver Partner', 'Gold Partner' };
    Map<String, String[]> tierBenefitNames = new Map<String, String[]>();

    for (String tierName : tierOrder) {
        tierBenefitNames.put(tierName, new String[]{});
    }
    for (Object[] def : BENEFIT_DEFS) {
        String introTier   = (String)def[0];
        String benefitName = (String)def[1];
        Boolean addingNow  = false;
        for (String tierName : tierOrder) {
            if (tierName == introTier) addingNow = true;
            if (addingNow) {
                String[] names = tierBenefitNames.get(tierName);
                names.add(benefitName);
            }
        }
    }

    for (String tierName : tierOrder) {
        Id tierId = tierIdByName.get(tierName);
        if (tierId == null) continue;
        Set<String> alreadyLinked = existingTierBenefits.containsKey(tierId)
            ? existingTierBenefits.get(tierId)
            : new Set<String>();

        for (String benefitName : tierBenefitNames.get(tierName)) {
            Id benefitId = benefitIdByName.get(benefitName);
            if (benefitId == null) continue;
            if (alreadyLinked.contains(benefitId)) continue;

            SObject tb = (SObject)Type.forName('LoyaltyTierBenefit').newInstance();
            tb.put('LoyaltyTierId',        tierId);
            tb.put('LoyaltyBenefitTypeId', benefitId);
            tb.put('IsActive',             true);
            tierBenefitsToInsert.add(tb);
        }
    }
    if (!tierBenefitsToInsert.isEmpty()) {
        insert tierBenefitsToInsert;
        System.debug('✓ Created ' + tierBenefitsToInsert.size() + ' tier-benefit links');
    }

    // Summary
    System.debug('  Bronze Partner (4):  Portal, Standard SLA, Newsletter, Co-marketing');
    System.debug('  Silver Partner (9):  + Success Mgr, Priority SLA, Webinars, 2% Rebate, Early Access');
    System.debug('  Gold Partner  (16):  + Exec Sponsor, Same-Day SLA, Custom Pricing, QBR, Beta, Summit, 3% Rebate');

} else {
    System.debug('⚠ LoyaltyBenefitType / LoyaltyTierBenefit not available in schema.');
    System.debug('  Configure the following 13 benefits manually in Loyalty Management Setup:');
    System.debug('');
    System.debug('  BRONZE PARTNER (entry tier):');
    System.debug('    1. Partner Portal Access — full self-service portal');
    System.debug('    2. Standard Support SLA — 48-hour response, email & chat');
    System.debug('    3. Quarterly Partner Newsletter — roadmap, promos, intelligence');
    System.debug('    4. Co-Marketing Opportunities — templates + partner directory listing');
    System.debug('');
    System.debug('  SILVER PARTNER (+ all Bronze):');
    System.debug('    5. Dedicated Partner Success Manager — named contact');
    System.debug('    6. Priority Support SLA — 24-hour, phone + Tier-2 specialists');
    System.debug('    7. Monthly Partner Webinars & Training — live, invitation-only');
    System.debug('    8. 2% Volume Rebate — quarterly, paid within 30 days of quarter close');
    System.debug('    9. Early Product Access — 30-day advance notice + samples');
    System.debug('');
    System.debug('  GOLD PARTNER (+ all Silver):');
    System.debug('   10. Executive Sponsor Assignment — VP+ named champion');
    System.debug('   11. Same-Day Premium Support SLA — 2-hour response, 24/7 hotline');
    System.debug('   12. Custom Pricing & Terms — negotiated volume/payment arrangements');
    System.debug('   13. Quarterly Business Review (QBR) — executive-led joint planning');
    System.debug('   14. Beta Product & Co-Innovation Access — advisory council seat');
    System.debug('   15. Exclusive Partner Summit Invitation — annual, all-expenses-paid');
    System.debug('   16. 3% Volume Rebate — replaces Silver 2% rebate');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: PROMOTIONS
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 6: Promotions (3) ───────────────────────────────────');

Boolean hasLoyaltyPromotion = Schema.getGlobalDescribe().containsKey('LoyaltyPromotion');

if (hasLoyaltyPromotion) {
    Map<String, SObject> existingPromos = new Map<String, SObject>();
    String promoQuery = 'SELECT Id, Name FROM LoyaltyPromotion WHERE LoyaltyProgramId = \'' + prog.Id + '\'';
    for (SObject lp : Database.query(promoQuery)) {
        existingPromos.put((String)lp.get('Name'), lp);
    }

    List<SObject> promosToInsert = new List<SObject>();
    for (Object[] def : PROMOTION_DEFS) {
        String promoName = (String)def[0];
        if (existingPromos.containsKey(promoName)) {
            System.debug('✓ Exists:  ' + promoName);
            continue;
        }
        SObject lp = (SObject)Type.forName('LoyaltyPromotion').newInstance();
        lp.put('Name',             promoName);
        lp.put('LoyaltyProgramId', prog.Id);
        lp.put('PromotionType',    (String)def[1]);
        lp.put('StartDate',        (Date)def[2]);
        lp.put('EndDate',          (Date)def[3]);
        lp.put('Description',      (String)def[4]);
        lp.put('IsActive',         true);
        promosToInsert.add(lp);
    }

    if (!promosToInsert.isEmpty()) {
        try {
            insert promosToInsert;
            System.debug('✓ Created ' + promosToInsert.size() + ' promotions:');
        } catch (Exception e) {
            System.debug('⚠ Promotion insert failed: ' + e.getMessage());
            System.debug('  Configure promotions manually in Loyalty Management > Promotions.');
        }
    }

    System.debug('  1. New Partner Onboarding Bonus  — 3× pts, first 90 days of enrollment');
    System.debug('  2. Q4 Growth Accelerator         — 2× pts on orders ≥ $10 K, Oct–Dec');
    System.debug('  3. Product Expansion Bonus       — 500 bonus pts per new product category');
} else {
    System.debug('⚠ LoyaltyPromotion not in schema — configure in Loyalty Management > Promotions:');
    System.debug('  1. New Partner Onboarding Bonus  — 3× pts, first 90 days');
    System.debug('  2. Q4 Growth Accelerator         — 2× pts on orders ≥ $10 K, Oct–Dec');
    System.debug('  3. Product Expansion Bonus       — 500 bonus pts per new product category');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: PROCESS RULES
// ─────────────────────────────────────────────────────────────────────────────

System.debug('── STEP 7: Process Rules (4) ────────────────────────────────');

Boolean hasProcessRule = Schema.getGlobalDescribe().containsKey('LoyaltyProcessRule');

if (hasProcessRule) {
    Map<String, SObject> existingRules = new Map<String, SObject>();
    String ruleQuery = 'SELECT Id, Name FROM LoyaltyProcessRule WHERE LoyaltyProgramId = \'' + prog.Id + '\'';
    for (SObject r : Database.query(ruleQuery)) {
        existingRules.put((String)r.get('Name'), r);
    }

    List<SObject> rulesToInsert = new List<SObject>();
    for (Object[] def : PROCESS_RULE_DEFS) {
        String ruleName = (String)def[0];
        if (existingRules.containsKey(ruleName)) {
            System.debug('✓ Exists:  ' + ruleName);
            continue;
        }
        SObject rule = (SObject)Type.forName('LoyaltyProcessRule').newInstance();
        rule.put('Name',             ruleName);
        rule.put('LoyaltyProgramId', prog.Id);
        rule.put('RuleType',         (String)def[1]);
        rule.put('ExecutionOrder',   (Integer)def[2]);
        rule.put('Description',      (String)def[3]);
        rule.put('IsActive',         true);
        rulesToInsert.add(rule);
    }

    if (!rulesToInsert.isEmpty()) {
        try {
            insert rulesToInsert;
            System.debug('✓ Created ' + rulesToInsert.size() + ' process rules');
        } catch (Exception e) {
            System.debug('⚠ Process rule insert failed: ' + e.getMessage());
            System.debug('  Configure process rules in Loyalty Management > Process Rules.');
        }
    }

    System.debug('  1. Standard Earning Rule         — 10 pts / $100 (exec order 10)');
    System.debug('  2. Tier Upgrade Rule             — auto-promote on QP threshold (exec order 20)');
    System.debug('  3. Annual Tier Review Rule       — downgrade on anniversary if QP below min (exec order 30)');
    System.debug('  4. Welcome & Upgrade Bonus       — 500/1000/2500 pts at enrollment/upgrade (exec order 40)');
} else {
    System.debug('⚠ LoyaltyProcessRule not in schema — configure in Loyalty Management > Process Rules:');
    System.debug('  1. Standard Earning Rule         — 10 pts / $100 spent');
    System.debug('  2. Tier Upgrade Rule             — Bronze→Silver at 5,000 QP; Silver→Gold at 15,000 QP');
    System.debug('  3. Annual Tier Review Rule       — downgrade if QP below threshold on anniversary');
    System.debug('  4. Welcome & Upgrade Bonus       — 500 pts enrollment; 1,000 Silver; 2,500 Gold');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

System.debug('');
System.debug('╔═══════════════════════════════════════════════════════════╗');
System.debug('║   SETUP COMPLETE — Partner Advantage Program              ║');
System.debug('╚═══════════════════════════════════════════════════════════╝');
System.debug('');
System.debug('Program ID:    ' + prog.Id);
System.debug('Tier Group ID: ' + tierGroup.Id);
System.debug('Currency ID:   ' + progCurrency.Id);
System.debug('');
System.debug('Tiers:');
System.debug('  Bronze Partner    0 – 4,999 QP   (< $50 K annual spend)    1% rebate');
System.debug('  Silver Partner  5,000 – 14,999 QP  ($50 K – $149 K)        2% rebate');
System.debug('  Gold Partner   15,000 + QP         ($150 K+)               3% rebate');
System.debug('');
System.debug('Earning rate: 10 pts per $100 spent');
System.debug('  $500 purchase  → 50 pts');
System.debug('  $5,000 purchase → 500 pts (triggers Silver at 10 × this)');
System.debug('  $50,000/yr      → 5,000 QP → Silver tier qualification');
System.debug('  $150,000/yr     → 15,000 QP → Gold tier qualification');
System.debug('');
System.debug('Benefits: 4 Bronze | 9 Silver (cumulative) | 16 Gold (cumulative)');
System.debug('Promotions: Onboarding 3× | Q4 Accelerator 2× | Category Expansion 500 pts');
System.debug('Process Rules: Standard Earn | Tier Upgrade | Annual Review | Welcome Bonus');
System.debug('');
System.debug('Next steps:');
System.debug('  1. Set Bronze Partner as the default enrollment tier in Loyalty Management UI');
System.debug('  2. Configure point accrual rules in Program > Process Rules (FlowBuilder)');
System.debug('  3. Enroll B2B Account-based members via Loyalty Management > Members');
System.debug('  4. Connect promotion conditions in Loyalty Management > Promotions');
System.debug('══════════════════════════════════════════════════════════════');
