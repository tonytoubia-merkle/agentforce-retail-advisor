/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tech Beauty Rewards — B2B Loyalty Program for Technology Partners
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   Tier              Min QP/Year   Rebate
 *   ────────────────  ───────────── ──────
 *   Starter Partner         0        2 %
 *   Growth Partner      2,500        5 %
 *   Elite Partner      10,000        8 %
 *
 * Run:
 *   sf apex run --file salesforce/scripts/setup-b2b-tech-beauty-rewards.apex -o my-org
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────

final String PROGRAM_NAME    = 'Tech Beauty Rewards';
final String TIER_GROUP_NAME = 'Tech Beauty Rewards Tiers';
final String CURRENCY_NAME   = 'Tech Partner Points';

// { Name, SequenceNumber, MinQualifyingPoints }
final List<Object[]> TIER_DEFS = new List<Object[]>{
    new Object[]{ 'Starter Partner', 1,     0 },
    new Object[]{ 'Growth Partner',  2,  2500 },
    new Object[]{ 'Elite Partner',   3, 10000 }
};

// ─── STEP 1: PROGRAM ────────────────────────────────────────────────────────

System.debug('── STEP 1: Program ──────────────────────────────────────────');

LoyaltyProgram prog;
List<LoyaltyProgram> existingProgs = [
    SELECT Id, Name, Status FROM LoyaltyProgram WHERE Name = :PROGRAM_NAME LIMIT 1
];
if (existingProgs.isEmpty()) {
    prog = new LoyaltyProgram(Name = PROGRAM_NAME, Status = 'Active');
    insert prog;
    System.debug('Created: ' + PROGRAM_NAME + ' [' + prog.Id + ']');
} else {
    prog = existingProgs[0];
    System.debug('Exists:  ' + PROGRAM_NAME + ' [' + prog.Id + ']');
}

// ─── STEP 2: TIER GROUP ─────────────────────────────────────────────────────

System.debug('── STEP 2: Tier Group ──────────────────────────────────────');

LoyaltyTierGroup tierGroup;
List<LoyaltyTierGroup> existingGroups = [
    SELECT Id, Name FROM LoyaltyTierGroup
    WHERE LoyaltyProgramId = :prog.Id AND Name = :TIER_GROUP_NAME LIMIT 1
];
if (existingGroups.isEmpty()) {
    tierGroup = new LoyaltyTierGroup(
        Name             = TIER_GROUP_NAME,
        LoyaltyProgramId = prog.Id,
        IsActive         = true,
        TierModel        = 'Anniversary',
        QpResetPeriod    = 'Years',
        QpResetFrequency = 1
    );
    insert tierGroup;
    System.debug('Created: ' + TIER_GROUP_NAME + ' [' + tierGroup.Id + ']');
} else {
    tierGroup = existingGroups[0];
    System.debug('Exists:  ' + TIER_GROUP_NAME + ' [' + tierGroup.Id + ']');
}

// ─── STEP 3: TIERS ──────────────────────────────────────────────────────────

System.debug('── STEP 3: Tiers ───────────────────────────────────────────');

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
        System.debug('Exists:  ' + tierName);
    }
}
if (!tiersToInsert.isEmpty()) {
    insert tiersToInsert;
    for (LoyaltyTier t : tiersToInsert) {
        System.debug('Created: ' + t.Name + ' [' + t.Id + ']');
    }
}

// Refresh tier map
Map<String, Id> tierIdByName = new Map<String, Id>();
for (LoyaltyTier t : [SELECT Id, Name, SequenceNumber FROM LoyaltyTier WHERE LoyaltyTierGroupId = :tierGroup.Id ORDER BY SequenceNumber]) {
    tierIdByName.put(t.Name, t.Id);
    System.debug('  ' + t.Name + ' (seq=' + t.SequenceNumber + '): ' + t.Id);
}

// ─── STEP 4: PROGRAM CURRENCY ───────────────────────────────────────────────

System.debug('── STEP 4: Program Currency ────────────────────────────────');

LoyaltyProgramCurrency progCurrency;
List<LoyaltyProgramCurrency> existingCurrencies = [
    SELECT Id, Name FROM LoyaltyProgramCurrency
    WHERE LoyaltyProgramId = :prog.Id AND Name = :CURRENCY_NAME LIMIT 1
];
if (existingCurrencies.isEmpty()) {
    progCurrency = new LoyaltyProgramCurrency(
        Name               = CURRENCY_NAME,
        LoyaltyProgramId   = prog.Id,
        LoyaltyTierGroupId = tierGroup.Id,
        CurrencyType       = 'Qualifying',
        IsActive           = true
    );
    insert progCurrency;
    System.debug('Created: ' + CURRENCY_NAME + ' [' + progCurrency.Id + ']');
} else {
    progCurrency = existingCurrencies[0];
    System.debug('Exists:  ' + CURRENCY_NAME + ' [' + progCurrency.Id + ']');
}

// ─── STEP 5: BENEFIT TYPES + BENEFITS ────────────────────────────────────────

System.debug('── STEP 5: Benefits ──────────────────────────────────────');

// Ensure "Each" unit of measure exists
Id eachUnitId;
List<UnitOfMeasure> eachUnits = [SELECT Id FROM UnitOfMeasure WHERE Name = 'Each' LIMIT 1];
if (eachUnits.isEmpty()) {
    UnitOfMeasure uom = new UnitOfMeasure(Name = 'Each', UnitCode = 'EA');
    insert uom;
    eachUnitId = uom.Id;
} else {
    eachUnitId = eachUnits[0].Id;
}

// { tierName, benefitName, category, description }
List<Object[]> BENEFIT_DEFS = new List<Object[]>{
    // Starter
    new Object[]{ 'Starter Partner', 'API Access', 'Technology', 'Full access to product and order APIs' },
    new Object[]{ 'Starter Partner', 'Developer Sandbox', 'Technology', 'Dedicated sandbox for integration development' },
    new Object[]{ 'Starter Partner', 'Standard Support', 'Support', 'Email support with 48-hour SLA' },
    new Object[]{ 'Starter Partner', 'Quarterly Newsletter', 'Communication', 'Partner newsletter with roadmap updates' },
    // Growth
    new Object[]{ 'Growth Partner', 'Dedicated TAM', 'Support', 'Technical Account Manager for integration guidance' },
    new Object[]{ 'Growth Partner', 'Priority Support', 'Support', 'Priority support queue with 12-hour SLA' },
    new Object[]{ 'Growth Partner', 'Co-marketing Fund', 'Marketing', '$5K annual co-marketing fund' },
    new Object[]{ 'Growth Partner', 'Early API Access', 'Technology', 'New API endpoints 30 days before GA' },
    // Elite
    new Object[]{ 'Elite Partner', 'Executive Sponsor', 'Strategic', 'Named executive sponsor for strategic alignment' },
    new Object[]{ 'Elite Partner', 'Premium Support', 'Support', '4-hour SLA with dedicated Slack channel' },
    new Object[]{ 'Elite Partner', 'Joint Go-to-Market', 'Marketing', 'Joint GTM planning and co-branded materials' },
    new Object[]{ 'Elite Partner', 'Beta Program', 'Technology', 'Beta APIs with product team feedback loop' },
    // Rebates (tier-specific)
    new Object[]{ 'Starter Partner', '2% Volume Rebate', 'Financial', '2% quarterly volume rebate' },
    new Object[]{ 'Growth Partner', '5% Volume Rebate', 'Financial', '5% quarterly volume rebate' },
    new Object[]{ 'Elite Partner', '8% Volume Rebate', 'Financial', '8% quarterly volume rebate' }
};

Set<String> rebateNames = new Set<String>{ '2% Volume Rebate', '5% Volume Rebate', '8% Volume Rebate' };
Map<String, Integer> tierIdx = new Map<String, Integer>{
    'Starter Partner' => 0, 'Growth Partner' => 1, 'Elite Partner' => 2
};

// Create BenefitTypes
Map<String, Id> btIdByName = new Map<String, Id>();
for (BenefitType bt : [SELECT Id, Name FROM BenefitType WHERE LoyaltyProgramId = :prog.Id]) {
    btIdByName.put(bt.Name, bt.Id);
}

List<BenefitType> btToInsert = new List<BenefitType>();
for (Object[] def : BENEFIT_DEFS) {
    String bName = (String)def[1];
    if (btIdByName.containsKey(bName)) continue;
    btToInsert.add(new BenefitType(
        Name = bName, LoyaltyProgramId = prog.Id,
        ProcessType = 'Loyalty', Category = (String)def[2],
        UnitOfMeasureId = eachUnitId, Description = ((String)def[3]).left(80)
    ));
}
if (!btToInsert.isEmpty()) {
    insert btToInsert;
    System.debug('Created ' + btToInsert.size() + ' BenefitType records');
}
// Refresh
btIdByName.clear();
for (BenefitType bt : [SELECT Id, Name FROM BenefitType WHERE LoyaltyProgramId = :prog.Id]) {
    btIdByName.put(bt.Name, bt.Id);
}

// Create Benefits
Map<String, Id> benefitIdByName = new Map<String, Id>();
for (Benefit b : [SELECT Id, Name FROM Benefit WHERE BenefitTypeId IN :btIdByName.values()]) {
    benefitIdByName.put(b.Name, b.Id);
}

List<Benefit> bToInsert = new List<Benefit>();
for (Object[] def : BENEFIT_DEFS) {
    String bName = (String)def[1];
    if (benefitIdByName.containsKey(bName)) continue;
    Id btId = btIdByName.get(bName);
    if (btId == null) continue;
    bToInsert.add(new Benefit(
        Name = bName, BenefitTypeId = btId, UnitId = eachUnitId,
        Description = (String)def[3], IsActive = true,
        BenefitStatus = 'Active', StartDateTime = Datetime.now()
    ));
}
if (!bToInsert.isEmpty()) {
    insert bToInsert;
    System.debug('Created ' + bToInsert.size() + ' Benefit records');
}
// Refresh
benefitIdByName.clear();
for (Benefit b : [SELECT Id, Name FROM Benefit WHERE BenefitTypeId IN :btIdByName.values()]) {
    benefitIdByName.put(b.Name, b.Id);
}

// Link benefits to tiers
Integer linksCreated = 0;
for (Object[] def : BENEFIT_DEFS) {
    String minTier = (String)def[0];
    String bName = (String)def[1];
    Boolean isRebate = rebateNames.contains(bName);
    Id benefitId = benefitIdByName.get(bName);
    if (benefitId == null) continue;

    Integer minIdx = tierIdx.get(minTier);
    for (String tierName : tierIdx.keySet()) {
        Integer idx = tierIdx.get(tierName);
        // Rebates: specific tier only. Benefits: cumulative (this tier + higher)
        if (isRebate && !tierName.equals(minTier)) continue;
        if (!isRebate && idx < minIdx) continue;

        Id tierId = tierIdByName.get(tierName);
        if (tierId == null) continue;
        List<LoyaltyTierBenefit> existLink = [SELECT Id FROM LoyaltyTierBenefit WHERE LoyaltyTierId = :tierId AND BenefitId = :benefitId LIMIT 1];
        if (existLink.isEmpty()) {
            insert new LoyaltyTierBenefit(
                Name = tierName.left(20) + ' - ' + bName.left(55),
                LoyaltyTierId = tierId, BenefitId = benefitId
            );
            linksCreated++;
        }
    }
}
System.debug('Created ' + linksCreated + ' tier-benefit links');

// ─── STEP 6: PROCESSES ──────────────────────────────────────────────────────

System.debug('── STEP 6: Processes ─────────────────────────────────────');

// Look up JournalTypes for TransactionJournal processes
Map<String, Id> journalTypeByName = new Map<String, Id>();
for (SObject jt : Database.query('SELECT Id, Name FROM JournalType ORDER BY Name')) {
    journalTypeByName.put((String)jt.get('Name'), (Id)jt.get('Id'));
}
System.debug('JournalTypes: ' + journalTypeByName.keySet());

// { Name, ProcessType, ExecutionType, JournalTypeName (or null), Description }
List<Object[]> PROCESS_DEFS = new List<Object[]>{
    new Object[]{ 'Tech Partner Standard Earning', 'TransactionJournal', 'RealTime', 'Accrual', '10 qualifying points per $100 spent' },
    new Object[]{ 'Tech Partner Tier Upgrade', 'TierProcessing', 'RealTime', null, 'Auto-promote when QP threshold crossed' },
    new Object[]{ 'Tech Partner Annual Review', 'TierProcessing', 'Batch', null, 'Annual tier review on membership anniversary' },
    new Object[]{ 'Tech Partner Welcome Bonus', 'TransactionJournal', 'RealTime', 'Manual Points Adjustment', 'Award 250 welcome points on enrollment' }
};

Map<String, Id> existingProcesses = new Map<String, Id>();
for (LoyaltyProgramProcess lpp : [SELECT Id, Name FROM LoyaltyProgramProcess WHERE LoyaltyProgramId = :prog.Id]) {
    existingProcesses.put(lpp.Name, lpp.Id);
}

for (Object[] def : PROCESS_DEFS) {
    String pName = (String)def[0];
    if (existingProcesses.containsKey(pName)) {
        System.debug('Exists:  ' + pName);
        continue;
    }
    String jtName = (String)def[3];
    LoyaltyProgramProcess lpp = new LoyaltyProgramProcess(
        Name = pName,
        LoyaltyProgramId = prog.Id,
        ProcessType = (String)def[1],
        ExecutionType = (String)def[2],
        Status = 'Draft',
        Description = (String)def[4]
    );
    if (jtName != null && journalTypeByName.containsKey(jtName)) {
        lpp.JournalTypeId = journalTypeByName.get(jtName);
    }
    if ((String)def[1] == 'TierProcessing') {
        lpp.LoyaltyTierGroupId = tierGroup.Id;
    }
    insert lpp;
    System.debug('Created: ' + pName);
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

System.debug('═══════════════════════════════════════════════════════════');
System.debug('Tech Beauty Rewards — Setup Complete');
System.debug('Program:   Tech Beauty Rewards');
System.debug('Tiers:     Starter (0 QP, 2%) -> Growth (2500 QP, 5%) -> Elite (10000 QP, 8%)');
System.debug('Benefits:  15 (4 Starter + 4 Growth + 4 Elite + 3 rebates)');
System.debug('Processes: 4 (earning, upgrade, review, welcome)');
System.debug('═══════════════════════════════════════════════════════════');
