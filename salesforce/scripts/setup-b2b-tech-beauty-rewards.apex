/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tech Beauty Rewards — B2B Loyalty Program for Technology Partners
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 3-Tier program for technology integration partners:
 *
 *   Tier              Min QP/Year   Annual Spend Equiv.   Rebate
 *   ────────────────  ───────────── ─────────────────────  ──────
 *   Starter Partner         0        < $25,000              2 %
 *   Growth Partner      2,500        $25,000 – $99,999      5 %
 *   Elite Partner      10,000        $100,000 +             8 %
 *
 * Earning rate: 10 qualifying points per $100 spent
 * QP reset: annually on membership anniversary
 *
 * Benefits (cumulative per tier):
 *   Starter (4): API Access, Developer Sandbox, Standard Support, Quarterly Newsletter
 *   Growth  +4:  Dedicated TAM, Priority Support, Co-marketing Fund, Early API Access
 *   Elite   +4:  Executive Sponsor, Premium Support, Joint Go-to-Market, Beta Program
 *
 * Run:
 *   sf apex run --file salesforce/scripts/setup-b2b-tech-beauty-rewards.apex -o my-org
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOYALTY PROGRAM
// ─────────────────────────────────────────────────────────────────────────────

LoyaltyProgram program;

// Check if program already exists
List<LoyaltyProgram> existing = [SELECT Id FROM LoyaltyProgram WHERE Name = 'Tech Beauty Rewards' LIMIT 1];
if (!existing.isEmpty()) {
    program = existing[0];
    System.debug('Program already exists: ' + program.Id);
} else {
    program = new LoyaltyProgram(
        Name = 'Tech Beauty Rewards',
        LoyaltyProgramType = 'Tiered'
    );
    insert program;
    System.debug('Created program: ' + program.Id);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TIERS (3-tier: Starter → Growth → Elite)
// ─────────────────────────────────────────────────────────────────────────────

Map<String, LoyaltyTier> tierMap = new Map<String, LoyaltyTier>();

List<Map<String, Object>> tierDefs = new List<Map<String, Object>>{
    new Map<String, Object>{
        'name' => 'Starter Partner',
        'description' => 'Entry tier for technology partners. Includes API access, developer sandbox, and standard support.',
        'minPoints' => 0,
        'rebate' => 2
    },
    new Map<String, Object>{
        'name' => 'Growth Partner',
        'description' => 'Mid-tier for growing technology partners. Adds dedicated TAM, priority support, and co-marketing.',
        'minPoints' => 2500,
        'rebate' => 5
    },
    new Map<String, Object>{
        'name' => 'Elite Partner',
        'description' => 'Top tier for strategic technology partners. Premium support, joint GTM, and beta access.',
        'minPoints' => 10000,
        'rebate' => 8
    }
};

for (Integer i = 0; i < tierDefs.size(); i++) {
    Map<String, Object> def = tierDefs[i];
    String tierName = (String) def.get('name');

    List<LoyaltyTier> existingTier = [SELECT Id FROM LoyaltyTier WHERE LoyaltyProgramId = :program.Id AND Name = :tierName LIMIT 1];
    LoyaltyTier tier;
    if (!existingTier.isEmpty()) {
        tier = existingTier[0];
        System.debug('Tier already exists: ' + tierName);
    } else {
        tier = new LoyaltyTier(
            LoyaltyProgramId = program.Id,
            Name = tierName,
            Description = (String) def.get('description')
        );
        insert tier;
        System.debug('Created tier: ' + tierName + ' (' + tier.Id + ')');
    }
    tierMap.put(tierName, tier);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUALIFYING CURRENCY (Tech Partner Points)
// ─────────────────────────────────────────────────────────────────────────────

List<LoyaltyProgramCurrency> existingCurrency = [
    SELECT Id FROM LoyaltyProgramCurrency
    WHERE LoyaltyProgramId = :program.Id AND Name = 'Tech Partner Points'
    LIMIT 1
];

LoyaltyProgramCurrency currency;
if (!existingCurrency.isEmpty()) {
    currency = existingCurrency[0];
    System.debug('Currency already exists: ' + currency.Id);
} else {
    currency = new LoyaltyProgramCurrency(
        LoyaltyProgramId = program.Id,
        Name = 'Tech Partner Points',
        CurrencyType = 'Qualifying',
        CurrencyIsoCode = 'USD',
        ExpirationType = 'FixedDate'
    );
    insert currency;
    System.debug('Created currency: ' + currency.Id);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TIER GROUPS (link tiers to qualifying currency with thresholds)
// ─────────────────────────────────────────────────────────────────────────────

Map<String, Integer> thresholds = new Map<String, Integer>{
    'Starter Partner' => 0,
    'Growth Partner' => 2500,
    'Elite Partner' => 10000
};

for (String tierName : thresholds.keySet()) {
    LoyaltyTier tier = tierMap.get(tierName);
    Integer minPts = thresholds.get(tierName);

    List<LoyaltyTierGroup> existingGroup = [
        SELECT Id FROM LoyaltyTierGroup
        WHERE LoyaltyTierId = :tier.Id AND LoyaltyProgramCurrencyId = :currency.Id
        LIMIT 1
    ];

    if (existingGroup.isEmpty()) {
        LoyaltyTierGroup tg = new LoyaltyTierGroup(
            LoyaltyTierId = tier.Id,
            LoyaltyProgramCurrencyId = currency.Id,
            MinimumPointsRequired = minPts
        );
        insert tg;
        System.debug('Created tier group: ' + tierName + ' (min ' + minPts + ' pts)');
    } else {
        System.debug('Tier group already exists for: ' + tierName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BENEFIT TYPES + BENEFITS (12 total, cumulative across tiers)
// ─────────────────────────────────────────────────────────────────────────────

// Define benefits per tier (cumulative: Growth includes Starter, Elite includes all)
List<Map<String, String>> benefitDefs = new List<Map<String, String>>{
    // Starter Partner benefits
    new Map<String, String>{ 'name' => 'API Access', 'desc' => 'Full access to BEAUTÉ product and order APIs', 'tier' => 'Starter Partner', 'category' => 'Technology' },
    new Map<String, String>{ 'name' => 'Developer Sandbox', 'desc' => 'Dedicated sandbox environment for integration development', 'tier' => 'Starter Partner', 'category' => 'Technology' },
    new Map<String, String>{ 'name' => 'Standard Support', 'desc' => 'Email support with 48-hour SLA', 'tier' => 'Starter Partner', 'category' => 'Support' },
    new Map<String, String>{ 'name' => 'Quarterly Newsletter', 'desc' => 'Quarterly partner newsletter with roadmap updates', 'tier' => 'Starter Partner', 'category' => 'Communication' },

    // Growth Partner benefits (additive)
    new Map<String, String>{ 'name' => 'Dedicated TAM', 'desc' => 'Dedicated Technical Account Manager for integration guidance', 'tier' => 'Growth Partner', 'category' => 'Support' },
    new Map<String, String>{ 'name' => 'Priority Support', 'desc' => 'Priority support queue with 12-hour SLA', 'tier' => 'Growth Partner', 'category' => 'Support' },
    new Map<String, String>{ 'name' => 'Co-marketing Fund', 'desc' => '$5,000 annual co-marketing fund for joint campaigns', 'tier' => 'Growth Partner', 'category' => 'Marketing' },
    new Map<String, String>{ 'name' => 'Early API Access', 'desc' => 'Early access to new API endpoints 30 days before GA', 'tier' => 'Growth Partner', 'category' => 'Technology' },

    // Elite Partner benefits (additive)
    new Map<String, String>{ 'name' => 'Executive Sponsor', 'desc' => 'Named executive sponsor for strategic alignment', 'tier' => 'Elite Partner', 'category' => 'Leadership' },
    new Map<String, String>{ 'name' => 'Premium Support', 'desc' => 'Premium support with 4-hour SLA and dedicated Slack channel', 'tier' => 'Elite Partner', 'category' => 'Support' },
    new Map<String, String>{ 'name' => 'Joint Go-to-Market', 'desc' => 'Joint GTM planning, co-branded materials, and shared pipeline', 'tier' => 'Elite Partner', 'category' => 'Marketing' },
    new Map<String, String>{ 'name' => 'Beta Program', 'desc' => 'Access to beta APIs and features with direct product team feedback loop', 'tier' => 'Elite Partner', 'category' => 'Technology' }
};

// Track created BenefitType IDs for tier linking
Map<String, Id> benefitTypeIds = new Map<String, Id>();

for (Map<String, String> bDef : benefitDefs) {
    String bName = bDef.get('name');

    // Create BenefitType (or find existing)
    List<BenefitType> existingBT = [SELECT Id FROM BenefitType WHERE Name = :bName AND LoyaltyProgramId = :program.Id LIMIT 1];
    BenefitType bt;
    if (!existingBT.isEmpty()) {
        bt = existingBT[0];
    } else {
        bt = new BenefitType(
            Name = bName,
            Description = bDef.get('desc'),
            LoyaltyProgramId = program.Id
        );
        insert bt;
    }
    benefitTypeIds.put(bName, bt.Id);

    // Create Benefit record
    List<Benefit> existingB = [SELECT Id FROM Benefit WHERE BenefitTypeId = :bt.Id AND LoyaltyProgramId = :program.Id LIMIT 1];
    if (existingB.isEmpty()) {
        Benefit b = new Benefit(
            Name = bName,
            Description = bDef.get('desc'),
            BenefitTypeId = bt.Id,
            LoyaltyProgramId = program.Id,
            IsActive = true
        );
        insert b;
        System.debug('Created benefit: ' + bName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TIER-BENEFIT LINKS (cumulative: higher tiers get all lower benefits)
// ─────────────────────────────────────────────────────────────────────────────

// Map tier names to their index for cumulative logic
Map<String, Integer> tierIndex = new Map<String, Integer>{
    'Starter Partner' => 0,
    'Growth Partner' => 1,
    'Elite Partner' => 2
};

Integer linksCreated = 0;
for (Map<String, String> bDef : benefitDefs) {
    String bName = bDef.get('name');
    String minTier = bDef.get('tier');
    Integer minTierIdx = tierIndex.get(minTier);
    Id btId = benefitTypeIds.get(bName);

    // Get the Benefit record for this BenefitType
    List<Benefit> benefits = [SELECT Id FROM Benefit WHERE BenefitTypeId = :btId AND LoyaltyProgramId = :program.Id LIMIT 1];
    if (benefits.isEmpty()) continue;
    Id benefitId = benefits[0].Id;

    // Link to this tier and all higher tiers
    for (String tierName : tierIndex.keySet()) {
        Integer idx = tierIndex.get(tierName);
        if (idx < minTierIdx) continue; // Skip tiers below minimum

        LoyaltyTier tier = tierMap.get(tierName);
        List<LoyaltyTierBenefit> existingLink = [
            SELECT Id FROM LoyaltyTierBenefit
            WHERE LoyaltyTierId = :tier.Id AND BenefitId = :benefitId
            LIMIT 1
        ];

        if (existingLink.isEmpty()) {
            LoyaltyTierBenefit ltb = new LoyaltyTierBenefit(
                LoyaltyTierId = tier.Id,
                BenefitId = benefitId
            );
            insert ltb;
            linksCreated++;
        }
    }
}
System.debug('Created ' + linksCreated + ' tier-benefit links');

// ─────────────────────────────────────────────────────────────────────────────
// 7. REBATE BENEFITS (tier-specific rebate percentages)
// ─────────────────────────────────────────────────────────────────────────────

Map<String, Integer> rebateByTier = new Map<String, Integer>{
    'Starter Partner' => 2,
    'Growth Partner' => 5,
    'Elite Partner' => 8
};

for (String tierName : rebateByTier.keySet()) {
    Integer rebatePct = rebateByTier.get(tierName);
    String rebateName = rebatePct + '% Volume Rebate';

    // Create rebate BenefitType
    List<BenefitType> existingRBT = [SELECT Id FROM BenefitType WHERE Name = :rebateName AND LoyaltyProgramId = :program.Id LIMIT 1];
    BenefitType rbt;
    if (!existingRBT.isEmpty()) {
        rbt = existingRBT[0];
    } else {
        rbt = new BenefitType(
            Name = rebateName,
            Description = rebatePct + '% quarterly volume rebate on all eligible purchases',
            LoyaltyProgramId = program.Id
        );
        insert rbt;
    }

    // Create Benefit
    List<Benefit> existingRB = [SELECT Id FROM Benefit WHERE BenefitTypeId = :rbt.Id AND LoyaltyProgramId = :program.Id LIMIT 1];
    Benefit rb;
    if (existingRB.isEmpty()) {
        rb = new Benefit(
            Name = rebateName,
            Description = rebatePct + '% quarterly volume rebate',
            BenefitTypeId = rbt.Id,
            LoyaltyProgramId = program.Id,
            IsActive = true
        );
        insert rb;
    } else {
        rb = existingRB[0];
    }

    // Link to tier
    LoyaltyTier tier = tierMap.get(tierName);
    List<LoyaltyTierBenefit> existingLink = [
        SELECT Id FROM LoyaltyTierBenefit
        WHERE LoyaltyTierId = :tier.Id AND BenefitId = :rb.Id
        LIMIT 1
    ];
    if (existingLink.isEmpty()) {
        insert new LoyaltyTierBenefit(
            LoyaltyTierId = tier.Id,
            BenefitId = rb.Id
        );
        System.debug('Linked ' + rebateName + ' to ' + tierName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. LOYALTY PROGRAM PROCESSES (earning + tier management)
// ─────────────────────────────────────────────────────────────────────────────

List<Map<String, String>> processDefs = new List<Map<String, String>>{
    new Map<String, String>{
        'name' => 'Tech Partner Standard Earning',
        'type' => 'PointsEarning',
        'desc' => 'Standard earning rule: 10 qualifying points per $100 spent'
    },
    new Map<String, String>{
        'name' => 'Tech Partner Tier Upgrade',
        'type' => 'TierProcessing',
        'desc' => 'Auto-promote partner when qualifying points threshold is crossed'
    },
    new Map<String, String>{
        'name' => 'Tech Partner Annual Review',
        'type' => 'TierProcessing',
        'desc' => 'Annual tier review on membership anniversary date'
    },
    new Map<String, String>{
        'name' => 'Tech Partner Welcome Bonus',
        'type' => 'PointsEarning',
        'desc' => 'Award 250 welcome points on enrollment'
    }
};

for (Map<String, String> pDef : processDefs) {
    String pName = pDef.get('name');
    List<LoyaltyProgramProcess> existingP = [
        SELECT Id FROM LoyaltyProgramProcess
        WHERE LoyaltyProgramId = :program.Id AND Name = :pName
        LIMIT 1
    ];

    if (existingP.isEmpty()) {
        LoyaltyProgramProcess lpp = new LoyaltyProgramProcess(
            LoyaltyProgramId = program.Id,
            Name = pName,
            ProcessType = pDef.get('type'),
            Description = pDef.get('desc'),
            Status = 'Active'
        );
        insert lpp;
        System.debug('Created process: ' + pName);
    } else {
        System.debug('Process already exists: ' + pName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

System.debug('═══════════════════════════════════════════════════════');
System.debug('Tech Beauty Rewards — Setup Complete');
System.debug('═══════════════════════════════════════════════════════');
System.debug('Program:    Tech Beauty Rewards');
System.debug('Tiers:      Starter Partner (0 QP) → Growth Partner (2,500 QP) → Elite Partner (10,000 QP)');
System.debug('Rebates:    2% → 5% → 8%');
System.debug('Benefits:   12 (4 Starter + 4 Growth + 4 Elite, cumulative)');
System.debug('Processes:  4 (earning, tier upgrade, annual review, welcome bonus)');
System.debug('Promotions: None (can be added later)');
System.debug('═══════════════════════════════════════════════════════');
