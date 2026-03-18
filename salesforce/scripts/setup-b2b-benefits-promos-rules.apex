/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Partner Advantage Program — Benefits, Promotions & Process Rules
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Prerequisite: run setup-b2b-loyalty-program.apex first (creates program,
 *               tier group, tiers, and currency).
 *
 * This script creates:
 *   STEP 1  — 16 BenefitType records (categorised)
 *   STEP 2  — 16 Benefit records (active, linked to types)
 *   STEP 3  — Tier-benefit links via LoyaltyTierBenefit (cumulative)
 *   STEP 4  — 3 Promotion records
 *   STEP 5  — PromotionTier links (all-tier promotions)
 *   STEP 6  — 4 LoyaltyProgramProcess records (process shells)
 *
 * Note: LoyaltyProgramProcessRule and LoyaltyProgramProcessParameter are
 *       read-only via API — configure rule conditions/actions in the UI
 *       after this script runs.
 *
 * Run:
 *   sf apex run --file salesforce/scripts/setup-b2b-benefits-promos-rules.apex -o my-org
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP: existing program, tier group, tiers, currency
// ─────────────────────────────────────────────────────────────────────────────

final String PROGRAM_NAME = 'Partner Advantage Program';

LoyaltyProgram prog = [SELECT Id FROM LoyaltyProgram WHERE Name = :PROGRAM_NAME LIMIT 1];
System.assert(prog != null, 'Program "' + PROGRAM_NAME + '" not found — run setup-b2b-loyalty-program.apex first');

LoyaltyTierGroup tierGroup = [SELECT Id FROM LoyaltyTierGroup WHERE LoyaltyProgramId = :prog.Id LIMIT 1];
LoyaltyProgramCurrency progCurrency = [SELECT Id FROM LoyaltyProgramCurrency WHERE LoyaltyProgramId = :prog.Id AND Name = 'Partner Points' LIMIT 1];

Map<String, Id> tierIdByName = new Map<String, Id>();
for (LoyaltyTier t : [SELECT Id, Name FROM LoyaltyTier WHERE LoyaltyTierGroupId = :tierGroup.Id]) {
    tierIdByName.put(t.Name, t.Id);
}
System.debug('Program:  ' + prog.Id);
System.debug('TierGrp:  ' + tierGroup.Id);
System.debug('Currency: ' + progCurrency.Id);
System.debug('Tiers:    ' + tierIdByName);
System.debug('');

// ═════════════════════════════════════════════════════════════════════════════
// STEP 1 & 2: BENEFIT TYPES + BENEFIT RECORDS
// ═════════════════════════════════════════════════════════════════════════════

System.debug('── STEP 1 & 2: Benefits ─────────────────────────────────────');

// { IntroTier, Name, Category, Description }
// Category groups benefits in the UI (Support, Financial, Enablement, Strategic)
List<Object[]> BENEFIT_DEFS = new List<Object[]>{
    // ── Bronze ────────────────────────────────────────────────────────────
    new Object[]{ 'Bronze Partner', 'Partner Portal Access', 'Enablement',
        'Full access to the Partner Portal: product catalog, training materials, sales collateral, and deal registration tools.' },
    new Object[]{ 'Bronze Partner', 'Standard Support SLA', 'Support',
        '48-hour response SLA with dedicated partner support queue. Email and chat support channels included.' },
    new Object[]{ 'Bronze Partner', 'Quarterly Partner Newsletter', 'Enablement',
        'Quarterly newsletter with product roadmap updates, industry insights, competitive intelligence, and promotional calendars.' },
    new Object[]{ 'Bronze Partner', 'Co-Marketing Opportunities', 'Enablement',
        'Access to co-branded marketing templates, joint press release templates, and listing on the partner directory.' },

    // ── Silver ────────────────────────────────────────────────────────────
    new Object[]{ 'Silver Partner', 'Dedicated Partner Success Manager', 'Support',
        'Named Partner Success Manager assigned to your account for strategic planning, quarterly check-ins, and escalation support.' },
    new Object[]{ 'Silver Partner', 'Priority Support SLA', 'Support',
        'Upgraded to 24-hour response SLA with phone support and direct access to Tier-2 technical specialists.' },
    new Object[]{ 'Silver Partner', 'Monthly Partner Webinars', 'Enablement',
        'Invitation-only monthly live training webinars covering new products, sales techniques, and technical deep-dives.' },
    new Object[]{ 'Silver Partner', '2% Volume Rebate', 'Financial',
        'Earn a 2% quarterly volume rebate on all qualifying net sales. Rebate is paid within 30 days of quarter close.' },
    new Object[]{ 'Silver Partner', 'Early Product Access', 'Strategic',
        'Receive advance notice and sample access to new product launches 30 days before general availability.' },

    // ── Gold ──────────────────────────────────────────────────────────────
    new Object[]{ 'Gold Partner', 'Executive Sponsor Assignment', 'Strategic',
        'A named executive sponsor (VP or above) assigned to champion your partnership internally and attend strategic meetings.' },
    new Object[]{ 'Gold Partner', 'Same-Day Premium Support SLA', 'Support',
        '2-hour initial response SLA with a dedicated 24/7 hotline. Critical issues handled by a senior engineering team.' },
    new Object[]{ 'Gold Partner', 'Custom Pricing & Terms', 'Financial',
        'Ability to negotiate custom pricing tiers, payment terms, and volume commitments tailored to your business model.' },
    new Object[]{ 'Gold Partner', 'Quarterly Business Review', 'Strategic',
        'Formal QBR sessions with executive leadership to review performance, set joint goals, and align on strategic initiatives.' },
    new Object[]{ 'Gold Partner', 'Beta Product & Co-Innovation', 'Strategic',
        'Seat on the Partner Advisory Council with access to beta products, roadmap input sessions, and co-development opportunities.' },
    new Object[]{ 'Gold Partner', 'Partner Summit Invitation', 'Strategic',
        'Annual all-expenses-paid invitation to the Partner Summit for networking, product previews, and executive keynotes.' },
    new Object[]{ 'Gold Partner', '3% Volume Rebate', 'Financial',
        'Upgraded to a 3% quarterly volume rebate on all qualifying net sales, replacing the Silver-tier 2% rebate.' }
};

// ── 1a. Ensure "Each" unit of measure exists ────────────────────────────────

Id eachUnitId;
List<UnitOfMeasure> eachUnits = [SELECT Id FROM UnitOfMeasure WHERE Name = 'Each' LIMIT 1];
if (eachUnits.isEmpty()) {
    UnitOfMeasure uom = new UnitOfMeasure(Name = 'Each', UnitCode = 'EA');
    insert uom;
    eachUnitId = uom.Id;
    System.debug('  ✓ Created UnitOfMeasure "Each": ' + eachUnitId);
} else {
    eachUnitId = eachUnits[0].Id;
    System.debug('  ✓ UnitOfMeasure "Each" exists: ' + eachUnitId);
}

// ── 1b. Create BenefitType records ──────────────────────────────────────────

Map<String, Id> existingBenefitTypes = new Map<String, Id>();
for (BenefitType bt : [SELECT Id, Name FROM BenefitType WHERE LoyaltyProgramId = :prog.Id]) {
    existingBenefitTypes.put(bt.Name, bt.Id);
}

List<BenefitType> btToInsert = new List<BenefitType>();
for (Object[] def : BENEFIT_DEFS) {
    String benefitName = (String)def[1];
    if (existingBenefitTypes.containsKey(benefitName)) {
        System.debug('  ✓ BenefitType exists: ' + benefitName);
        continue;
    }
    String shortDesc = ((String)def[3]).left(80);
    btToInsert.add(new BenefitType(
        Name             = benefitName,
        LoyaltyProgramId = prog.Id,
        ProcessType      = 'Loyalty',
        Category         = (String)def[2],
        UnitofMeasureId  = eachUnitId,
        Description      = shortDesc
    ));
}
if (!btToInsert.isEmpty()) {
    try {
        insert btToInsert;
        System.debug('  ✓ Created ' + btToInsert.size() + ' BenefitType records');
    } catch (Exception e) {
        System.debug('  ⚠ BenefitType insert failed: ' + e.getMessage());
    }
}

// Refresh BenefitType map
Map<String, Id> btIdByName = new Map<String, Id>();
for (BenefitType bt : [SELECT Id, Name FROM BenefitType WHERE LoyaltyProgramId = :prog.Id]) {
    btIdByName.put(bt.Name, bt.Id);
}

// ── 1c. Create Benefit records ──────────────────────────────────────────────

Map<String, Id> existingBenefits = new Map<String, Id>();
for (Benefit b : [SELECT Id, Name FROM Benefit WHERE BenefitTypeId IN :btIdByName.values()]) {
    existingBenefits.put(b.Name, b.Id);
}

List<Benefit> benefitsToInsert = new List<Benefit>();
for (Object[] def : BENEFIT_DEFS) {
    String benefitName = (String)def[1];
    if (existingBenefits.containsKey(benefitName)) {
        System.debug('  ✓ Benefit exists: ' + benefitName);
        continue;
    }
    Id btId = btIdByName.get(benefitName);
    if (btId == null) { System.debug('  ⚠ No BenefitType for: ' + benefitName); continue; }

    benefitsToInsert.add(new Benefit(
        Name           = benefitName,
        BenefitTypeId  = btId,
        UnitId         = eachUnitId,
        Description    = (String)def[3],
        IsActive       = true,
        BenefitStatus  = 'Active',
        StartDateTime  = Datetime.now()
    ));
}
if (!benefitsToInsert.isEmpty()) {
    System.debug('  Inserting ' + benefitsToInsert.size() + ' benefits, UnitId=' + eachUnitId);
    try {
        insert benefitsToInsert;
        System.debug('  ✓ Created ' + benefitsToInsert.size() + ' Benefit records');
    } catch (Exception e) {
        System.debug('  ⚠ Benefit insert failed: ' + e.getMessage());
        // Try one at a time to identify the problematic record
        for (Benefit b : benefitsToInsert) {
            try { insert b; System.debug('  ✓ ' + b.Name); }
            catch (Exception e2) { System.debug('  ✗ ' + b.Name + ': ' + e2.getMessage()); }
        }
    }
}

// Refresh Benefit map
Map<String, Id> benefitIdByName = new Map<String, Id>();
for (Benefit b : [SELECT Id, Name FROM Benefit WHERE BenefitTypeId IN :btIdByName.values()]) {
    benefitIdByName.put(b.Name, b.Id);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 3: TIER-BENEFIT LINKS (cumulative — higher tiers inherit lower)
// ═════════════════════════════════════════════════════════════════════════════

System.debug('── STEP 3: Tier-Benefit Links ───────────────────────────────');

// Build cumulative mapping: each tier gets its own benefits + all lower-tier benefits
List<String> tierOrder = new List<String>{ 'Bronze Partner', 'Silver Partner', 'Gold Partner' };
Map<String, List<String>> tierBenefitNames = new Map<String, List<String>>();
for (String tn : tierOrder) { tierBenefitNames.put(tn, new List<String>()); }

for (Object[] def : BENEFIT_DEFS) {
    String introTier   = (String)def[0];
    String benefitName = (String)def[1];
    Boolean addingNow  = false;
    for (String tn : tierOrder) {
        if (tn == introTier) addingNow = true;
        if (addingNow) {
            tierBenefitNames.get(tn).add(benefitName);
        }
    }
}

// Get existing tier-benefit links
Set<String> existingLinks = new Set<String>();
for (LoyaltyTierBenefit ltb : [
    SELECT LoyaltyTierId, BenefitId FROM LoyaltyTierBenefit
    WHERE LoyaltyTierId IN :tierIdByName.values()
]) {
    existingLinks.add(ltb.LoyaltyTierId + ':' + ltb.BenefitId);
}

List<LoyaltyTierBenefit> ltbToInsert = new List<LoyaltyTierBenefit>();
Integer linkCount = 0;
for (String tierName : tierOrder) {
    Id tierId = tierIdByName.get(tierName);
    if (tierId == null) continue;
    for (String benefitName : tierBenefitNames.get(tierName)) {
        Id benefitId = benefitIdByName.get(benefitName);
        if (benefitId == null) continue;
        String key = tierId + ':' + benefitId;
        if (existingLinks.contains(key)) continue;
        ltbToInsert.add(new LoyaltyTierBenefit(
            Name          = tierName.left(20) + ' - ' + benefitName.left(55),
            LoyaltyTierId = tierId,
            BenefitId     = benefitId
        ));
        linkCount++;
    }
}
if (!ltbToInsert.isEmpty()) {
    insert ltbToInsert;
    System.debug('  ✓ Created ' + ltbToInsert.size() + ' tier-benefit links');
}

// Summary
for (String tierName : tierOrder) {
    System.debug('  ' + tierName + ': ' + tierBenefitNames.get(tierName).size() + ' benefits');
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 4: PROMOTIONS
// ═════════════════════════════════════════════════════════════════════════════

System.debug('── STEP 4: Promotions ──────────────────────────────────────');

Date TODAY = Date.today();

// { Name, PromotionType, StartDate, EndDate, Description, PromotionCode }
List<Object[]> PROMO_DEFS = new List<Object[]>{
    new Object[]{
        'New Partner Onboarding Bonus',
        'Standard',
        TODAY,
        TODAY.addYears(5),
        '3x qualifying points on all purchases made within the first 90 days of program enrollment. ' +
        'Automatically applied at transaction time. Maximum 15,000 bonus points per enrollment.',
        'ONBOARD3X'
    },
    new Object[]{
        'Q4 Growth Accelerator',
        'Standard',
        Date.newInstance(TODAY.year(), 10, 1),
        Date.newInstance(TODAY.year(), 12, 31),
        '2x qualifying points on any single order of $10,000 or more placed during Q4 (October-December). ' +
        'Stackable with tier multipliers. Designed to reward year-end volume commitment.',
        'Q4GROW2X'
    },
    new Object[]{
        'Product Expansion Bonus',
        'Standard',
        TODAY,
        TODAY.addYears(3),
        '500 bonus qualifying points awarded the first time a partner places an order in a new product category. ' +
        'Each category can only be claimed once per membership year. Up to 10 categories eligible (5,000 pts max).',
        'EXPAND500'
    }
};

Map<String, Id> existingPromos = new Map<String, Id>();
for (Promotion p : [SELECT Id, Name FROM Promotion WHERE LoyaltyProgramId = :prog.Id]) {
    existingPromos.put(p.Name, p.Id);
}

List<Promotion> promosToInsert = new List<Promotion>();
for (Object[] def : PROMO_DEFS) {
    String promoName = (String)def[0];
    if (existingPromos.containsKey(promoName)) {
        System.debug('  ✓ Exists: ' + promoName);
        continue;
    }
    promosToInsert.add(new Promotion(
        Name                    = promoName,
        LoyaltyProgramId        = prog.Id,
        LoyaltyPromotionType    = (String)def[1],
        StartDate               = (Date)def[2],
        EndDate                 = (Date)def[3],
        Description             = (String)def[4],
        PromotionCode           = (String)def[5],
        LoyaltyProgramCurrencyId = progCurrency.Id,
        FulfillmentAction       = 'CreditPoints',
        TotalRewardPoints       = 10000,
        IsActive                = true,
        Status                  = 'InProgress'
    ));
}
if (!promosToInsert.isEmpty()) {
    insert promosToInsert;
    System.debug('  ✓ Created ' + promosToInsert.size() + ' promotions');
}

// Refresh promotion map
Map<String, Id> promoIdByName = new Map<String, Id>();
for (Promotion p : [SELECT Id, Name FROM Promotion WHERE LoyaltyProgramId = :prog.Id]) {
    promoIdByName.put(p.Name, p.Id);
}

// Note: PromotionTier is for tiered pricing structures (e.g. volume discounts),
// NOT for linking promotions to loyalty tiers. Tier eligibility for promotions
// is controlled via LoyaltyProgramProcessRule conditions in the UI.
// Promotions are already linked to the program via LoyaltyProgramId.

System.debug('  Promotions linked to program — tier eligibility configured via process rules in UI');
System.debug('');

// ═════════════════════════════════════════════════════════════════════════════
// STEP 5: PROCESS DEFINITIONS (LoyaltyProgramProcess)
// ═════════════════════════════════════════════════════════════════════════════

System.debug('── STEP 5: Process Definitions ──────────────────────────────');

// { Name, ProcessType, ExecutionType, JournalTypeName (or null), Description }
List<Object[]> PROCESS_DEFS = new List<Object[]>{
    new Object[]{
        'Standard Earning - 10 pts per $100',
        'TransactionJournal',
        'RealTime',
        'Accrual',
        'Awards 10 qualifying Partner Points for every $100 of eligible net purchase value. ' +
        'Excludes taxes, shipping, and returned items.'
    },
    new Object[]{
        'Tier Upgrade Rule',
        'TierProcessing',
        'RealTime',
        null,
        'Automatically evaluates qualifying points against tier thresholds after each qualifying transaction. ' +
        'Upgrades: Bronze to Silver at 5,000 QP; Silver to Gold at 15,000 QP.'
    },
    new Object[]{
        'Annual Tier Review',
        'TierProcessing',
        'Batch',
        null,
        'On each member anniversary, evaluates prior 12-month qualifying points. ' +
        'Downgrades member one tier if points fall below current tier minimum.'
    },
    new Object[]{
        'Welcome & Upgrade Bonus',
        'TransactionJournal',
        'RealTime',
        'Manual Points Adjustment',
        'Awards one-time bonus points: 500 pts on enrollment, ' +
        '1,000 pts on upgrade to Silver, 2,500 pts on upgrade to Gold.'
    }
};

// Look up JournalTypes for TransactionJournal processes
Map<String, Id> journalTypeByName = new Map<String, Id>();
for (SObject jt : Database.query('SELECT Id, Name FROM JournalType ORDER BY Name')) {
    journalTypeByName.put((String)jt.get('Name'), (Id)jt.get('Id'));
}
System.debug('  JournalTypes available: ' + journalTypeByName.keySet());

Map<String, Id> existingProcesses = new Map<String, Id>();
for (LoyaltyProgramProcess lpp : [
    SELECT Id, Name FROM LoyaltyProgramProcess WHERE LoyaltyProgramId = :prog.Id
]) {
    existingProcesses.put(lpp.Name, lpp.Id);
}

List<LoyaltyProgramProcess> processesToInsert = new List<LoyaltyProgramProcess>();
for (Object[] def : PROCESS_DEFS) {
    String processName = (String)def[0];
    if (existingProcesses.containsKey(processName)) {
        System.debug('  ✓ Exists: ' + processName);
        continue;
    }
    String pType = (String)def[1];
    String jtName = (String)def[3];
    String description = (String)def[4];
    LoyaltyProgramProcess lpp = new LoyaltyProgramProcess(
        Name               = processName,
        LoyaltyProgramId   = prog.Id,
        ProcessType        = pType,
        ExecutionType      = (String)def[2],
        Status             = 'Draft',
        Description        = description
    );
    if (pType == 'TransactionJournal' && jtName != null && journalTypeByName.containsKey(jtName)) {
        lpp.JournalTypeId = journalTypeByName.get(jtName);
    }
    if (pType == 'TierProcessing') {
        lpp.LoyaltyTierGroupId = tierGroup.Id;
    }
    processesToInsert.add(lpp);
}
if (!processesToInsert.isEmpty()) {
    insert processesToInsert;
    System.debug('  ✓ Created ' + processesToInsert.size() + ' process definitions');
}

// ═════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═════════════════════════════════════════════════════════════════════════════

System.debug('');
System.debug('╔═══════════════════════════════════════════════════════════╗');
System.debug('║   SETUP COMPLETE — Benefits, Promotions & Processes       ║');
System.debug('╚═══════════════════════════════════════════════════════════╝');
System.debug('');
System.debug('Benefits (cumulative by tier):');
System.debug('  Bronze Partner:  4 benefits  (Portal, Std SLA, Newsletter, Co-Marketing)');
System.debug('  Silver Partner:  9 benefits  (+Success Mgr, Priority SLA, Webinars, 2% Rebate, Early Access)');
System.debug('  Gold Partner:   16 benefits  (+Exec Sponsor, Same-Day SLA, Custom Pricing, QBR, Beta, Summit, 3% Rebate)');
System.debug('');
System.debug('Promotions:');
System.debug('  1. ONBOARD3X  — New Partner Onboarding Bonus (3× pts, 90 days)');
System.debug('  2. Q4GROW2X   — Q4 Growth Accelerator (2× on orders ≥ $10 K)');
System.debug('  3. EXPAND500  — Product Expansion Bonus (500 pts/category)');
System.debug('');
System.debug('Process Definitions:');
System.debug('  1. Standard Earning    (Accrual, RealTime)');
System.debug('  2. Tier Upgrade Rule   (TierProcessing, RealTime)');
System.debug('  3. Annual Tier Review  (TierProcessing, Scheduled)');
System.debug('  4. Welcome & Upgrade   (Accrual, RealTime)');
System.debug('');
System.debug('Note: Process rule CONDITIONS and PARAMETERS must be');
System.debug('configured in Loyalty Management UI (read-only via API).');
System.debug('══════════════════════════════════════════════════════════════');
