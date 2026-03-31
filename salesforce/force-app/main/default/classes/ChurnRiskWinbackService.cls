/**
 * ChurnRiskWinbackService — Identifies at-risk high-value customers and
 * creates 1:1 loyalty promotions + personalized hero moments to win them back.
 *
 * "At-risk high-value" = VIP/Gold+/Elite tier OR top-quartile CLV
 *                        AND no purchase in the last N days (default: 365).
 *
 * For each at-risk customer, the service:
 *   1. Creates a Promotion with LoyaltyPromotionType = 'PROGRAM_PROMOTION'
 *   2. Enrolls the member via LoyaltyProgramMbrPromotion
 *   3. Optionally creates a personalized Hero_Banner variation
 *   4. Optionally creates a journey approval for sequenced outreach
 *
 * Promotion types (configurable per call):
 *   - BONUS_POINTS: Award extra loyalty points on next purchase
 *   - DISCOUNT: $ or % off next purchase (via VoucherDefinition if available)
 *   - GIFT_WITH_PURCHASE: Flagged for fulfillment team
 *   - POINT_MULTIPLIER: 2x/3x points for a limited window
 */
public with sharing class ChurnRiskWinbackService {

    // ─── Types ──────────────────────────────────────────────────────────────

    public class AtRiskCustomer {
        @AuraEnabled public Id contactId;
        @AuraEnabled public String contactName;
        @AuraEnabled public String email;
        @AuraEnabled public String loyaltyTier;
        @AuraEnabled public Decimal lifetimeValue;
        @AuraEnabled public Date lastPurchaseDate;
        @AuraEnabled public Integer daysSinceLastPurchase;
        @AuraEnabled public Id loyaltyMemberId;
        @AuraEnabled public Id loyaltyProgramId;
    }

    public class WinbackRequest {
        @InvocableVariable(label='Inactive Days Threshold' description='Minimum days since last purchase to qualify (default: 365)')
        public Integer inactiveDays;
        @InvocableVariable(label='Promotion Type' description='BONUS_POINTS, DISCOUNT, GIFT_WITH_PURCHASE, or POINT_MULTIPLIER (default: BONUS_POINTS)')
        public String promotionType;
        @InvocableVariable(label='Bonus Points' description='Points to award (for BONUS_POINTS type, default: 500)')
        public Integer bonusPoints;
        @InvocableVariable(label='Point Multiplier' description='Multiplier factor (for POINT_MULTIPLIER type, default: 2)')
        public Integer pointMultiplier;
        @InvocableVariable(label='Promotion Duration Days' description='How many days the promotion is active (default: 30)')
        public Integer durationDays;
        @InvocableVariable(label='Create Hero Moment' description='Create a personalized hero banner for at-risk visitors (default: true)')
        public Boolean createHeroMoment;
        @InvocableVariable(label='Create Journey' description='Create journey approval for email/SMS outreach (default: true)')
        public Boolean createJourney;
        @InvocableVariable(label='Max Customers' description='Maximum number of at-risk customers to process (default: 50)')
        public Integer maxCustomers;
    }

    public class WinbackResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public Integer atRiskCustomersFound;
        @InvocableVariable public Integer promotionsCreated;
        @InvocableVariable public Integer heroVariationsCreated;
        @InvocableVariable public Integer journeysCreated;
        @InvocableVariable public String summary;
        @InvocableVariable public String atRiskCustomersJson;
        @InvocableVariable public String errorMessage;
    }

    @InvocableMethod(label='Identify At-Risk Customers and Create Winback Promotions' description='Finds high-value customers who havent purchased recently, creates personalized loyalty promotions, hero moments, and outreach journeys for each.')
    public static List<WinbackResponse> executeWinback(List<WinbackRequest> requests) {
        List<WinbackResponse> responses = new List<WinbackResponse>();
        for (WinbackRequest req : requests) {
            responses.add(processWinback(req));
        }
        return responses;
    }

    // ─── Core Logic ─────────────────────────────────────────────────────────

    private static WinbackResponse processWinback(WinbackRequest req) {
        WinbackResponse resp = new WinbackResponse();

        try {
            Integer inactiveDays = req.inactiveDays != null ? req.inactiveDays : 365;
            String promoType = String.isNotBlank(req.promotionType) ? req.promotionType : 'BONUS_POINTS';
            Integer durationDays = req.durationDays != null ? req.durationDays : 30;
            Integer maxCustomers = req.maxCustomers != null ? req.maxCustomers : 50;
            Boolean createHero = req.createHeroMoment == null || req.createHeroMoment;
            Boolean createJourney = req.createJourney == null || req.createJourney;

            // 1. Identify at-risk high-value customers
            List<AtRiskCustomer> atRisk = identifyAtRiskCustomers(inactiveDays, maxCustomers);
            resp.atRiskCustomersFound = atRisk.size();
            resp.atRiskCustomersJson = JSON.serialize(atRisk);

            if (atRisk.isEmpty()) {
                resp.success = true;
                resp.summary = 'No at-risk high-value customers found with ' + inactiveDays + '+ days of inactivity.';
                resp.promotionsCreated = 0;
                resp.heroVariationsCreated = 0;
                resp.journeysCreated = 0;
                return resp;
            }

            // 2. Create promotions + enroll members
            Integer promosCreated = createPromotions(atRisk, promoType, req, durationDays);
            resp.promotionsCreated = promosCreated;

            // 3. Create personalized hero moments
            Integer heroCount = 0;
            if (createHero) {
                heroCount = createHeroVariations(atRisk, promoType, req, durationDays);
            }
            resp.heroVariationsCreated = heroCount;

            // 4. Create journey approvals for outreach
            Integer journeyCount = 0;
            if (createJourney) {
                journeyCount = createWinbackJourneys(atRisk, promoType, req, durationDays);
            }
            resp.journeysCreated = journeyCount;

            resp.success = true;
            resp.summary = 'Winback campaign created for ' + atRisk.size() + ' at-risk high-value customers.\n' +
                '- ' + promosCreated + ' loyalty promotions created (' + promoType + ')\n' +
                '- ' + heroCount + ' personalized hero variations\n' +
                '- ' + journeyCount + ' outreach journeys queued\n' +
                'Duration: ' + durationDays + ' days. Threshold: ' + inactiveDays + '+ days inactive.';

        } catch (Exception e) {
            resp.success = false;
            resp.errorMessage = e.getMessage();
        }

        return resp;
    }

    // ─── 1. Identify At-Risk Customers ──────────────────────────────────────

    private static List<AtRiskCustomer> identifyAtRiskCustomers(Integer inactiveDays, Integer maxResults) {
        Date cutoffDate = Date.today().addDays(-inactiveDays);

        // Find loyalty members with their tier + contact info
        // VIP = Gold, Platinum, or Elite tier
        List<LoyaltyProgramMember> members = [
            SELECT Id, ContactId, Contact.FirstName, Contact.LastName, Contact.Email,
                   ProgramId
            FROM LoyaltyProgramMember
            WHERE MemberStatus = 'Active'
              AND ContactId != null
            LIMIT 500
        ];

        if (members.isEmpty()) return new List<AtRiskCustomer>();

        // Get tiers for these members
        Set<Id> memberIds = new Set<Id>();
        Map<Id, Id> memberToContact = new Map<Id, Id>();
        for (LoyaltyProgramMember m : members) {
            memberIds.add(m.Id);
            memberToContact.put(m.Id, m.ContactId);
        }

        Map<Id, String> memberTiers = new Map<Id, String>();
        for (LoyaltyMemberTier lmt : [
            SELECT LoyaltyMemberId, LoyaltyTier.Name
            FROM LoyaltyMemberTier
            WHERE LoyaltyMemberId IN :memberIds
            ORDER BY CreatedDate DESC
            LIMIT 500
        ]) {
            if (!memberTiers.containsKey(lmt.LoyaltyMemberId)) {
                memberTiers.put(lmt.LoyaltyMemberId, lmt.LoyaltyTier.Name);
            }
        }

        // Filter to VIP tiers only
        Set<String> vipTiers = new Set<String>{'Gold', 'Platinum', 'Elite', 'Diamond'};
        Set<Id> vipContactIds = new Set<Id>();
        Map<Id, LoyaltyProgramMember> contactToMember = new Map<Id, LoyaltyProgramMember>();
        Map<Id, String> contactToTier = new Map<Id, String>();

        for (LoyaltyProgramMember m : members) {
            String tier = memberTiers.get(m.Id);
            if (tier != null && vipTiers.contains(tier)) {
                vipContactIds.add(m.ContactId);
                contactToMember.put(m.ContactId, m);
                contactToTier.put(m.ContactId, tier);
            }
        }

        // Also include top-CLV contacts (even if not VIP tier)
        Map<Id, Decimal> contactTotals = new Map<Id, Decimal>();
        Set<Id> allContactIds = new Set<Id>();
        for (LoyaltyProgramMember m : members) allContactIds.add(m.ContactId);

        for (AggregateResult ar : [
            SELECT Contact__c cId, SUM(TotalAmount) total
            FROM Order
            WHERE Contact__c IN :allContactIds AND Status = 'Activated'
            GROUP BY Contact__c
        ]) {
            contactTotals.put((Id) ar.get('cId'), (Decimal) ar.get('total'));
        }

        // Top 25% CLV threshold
        List<Decimal> sortedTotals = new List<Decimal>(contactTotals.values());
        sortedTotals.sort();
        Decimal clvThreshold = sortedTotals.isEmpty() ? 0 :
            sortedTotals[Math.max(0, (Integer)(sortedTotals.size() * 0.75))];

        for (LoyaltyProgramMember m : members) {
            if (!vipContactIds.contains(m.ContactId)) {
                Decimal ltv = contactTotals.get(m.ContactId);
                if (ltv != null && ltv >= clvThreshold && clvThreshold > 0) {
                    vipContactIds.add(m.ContactId);
                    contactToMember.put(m.ContactId, m);
                    String tier = memberTiers.get(m.Id);
                    contactToTier.put(m.ContactId, tier != null ? tier + ' (High CLV)' : 'High CLV');
                }
            }
        }

        if (vipContactIds.isEmpty()) return new List<AtRiskCustomer>();

        // Find last purchase date for VIP contacts
        Map<Id, Date> lastPurchase = new Map<Id, Date>();
        for (AggregateResult ar : [
            SELECT Contact__c cId, MAX(EffectiveDate) lastDate
            FROM Order
            WHERE Contact__c IN :vipContactIds AND Status = 'Activated'
            GROUP BY Contact__c
        ]) {
            lastPurchase.put((Id) ar.get('cId'), (Date) ar.get('lastDate'));
        }

        // Build at-risk list: VIP + no purchase in threshold
        List<AtRiskCustomer> atRisk = new List<AtRiskCustomer>();
        for (Id cId : vipContactIds) {
            Date lastDate = lastPurchase.get(cId);
            // No purchase ever, or last purchase before cutoff = at-risk
            if (lastDate == null || lastDate <= cutoffDate) {
                LoyaltyProgramMember m = contactToMember.get(cId);
                if (m == null) continue;

                AtRiskCustomer arc = new AtRiskCustomer();
                arc.contactId = cId;
                arc.contactName = (m.Contact.FirstName != null ? m.Contact.FirstName + ' ' : '') +
                    (m.Contact.LastName != null ? m.Contact.LastName : '');
                arc.email = m.Contact.Email;
                arc.loyaltyTier = contactToTier.get(cId);
                arc.lifetimeValue = contactTotals.get(cId) != null ? contactTotals.get(cId) : 0;
                arc.lastPurchaseDate = lastDate;
                arc.daysSinceLastPurchase = lastDate != null ?
                    lastDate.daysBetween(Date.today()) : 9999;
                arc.loyaltyMemberId = m.Id;
                arc.loyaltyProgramId = m.ProgramId;

                atRisk.add(arc);
            }
        }

        // Sort by lifetime value descending, limit results
        atRisk.sort();
        if (atRisk.size() > maxResults) {
            List<AtRiskCustomer> trimmed = new List<AtRiskCustomer>();
            for (Integer i = 0; i < maxResults; i++) trimmed.add(atRisk[i]);
            return trimmed;
        }

        return atRisk;
    }

    // ─── 2. Create Promotions ───────────────────────────────────────────────

    private static Integer createPromotions(List<AtRiskCustomer> customers, String promoType, WinbackRequest req, Integer durationDays) {
        // Look up the loyalty program and currency
        Id programId = customers[0].loyaltyProgramId;
        Id currencyId;
        try {
            LoyaltyProgramCurrency lpc = [
                SELECT Id FROM LoyaltyProgramCurrency
                WHERE LoyaltyProgramId = :programId AND IsActive = true
                LIMIT 1
            ];
            currencyId = lpc.Id;
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'No active currency found: ' + e.getMessage());
        }

        List<Promotion> promotions = new List<Promotion>();
        Map<Id, Promotion> contactPromoMap = new Map<Id, Promotion>();

        for (AtRiskCustomer c : customers) {
            Promotion p = new Promotion();
            p.Name = 'Winback: ' + c.contactName + ' (' + promoType + ')';
            p.LoyaltyProgramId = c.loyaltyProgramId;
            p.LoyaltyPromotionType = 'PROGRAM_PROMOTION';
            p.Status = 'Active';
            p.IsActive = true;
            p.StartDate = Date.today();
            p.EndDate = Date.today().addDays(durationDays);
            p.IsEnrollmentRequired = true;

            if (promoType == 'BONUS_POINTS') {
                Integer points = req.bonusPoints != null ? req.bonusPoints : 500;
                p.Description = 'We miss you! Earn ' + points + ' bonus points on your next purchase.';
                p.TotalRewardPoints = points;
                if (currencyId != null) p.LoyaltyProgramCurrencyId = currencyId;
                p.FulfillmentAction = 'CREDIT_POINTS';
            } else if (promoType == 'POINT_MULTIPLIER') {
                Integer multiplier = req.pointMultiplier != null ? req.pointMultiplier : 2;
                p.Description = 'Welcome back! Earn ' + multiplier + 'x points on every purchase for ' + durationDays + ' days.';
                p.IsPointsWithFactor = true;
                p.PointFactor = multiplier;
                if (currencyId != null) p.LoyaltyProgramCurrencyId = currencyId;
                p.FulfillmentAction = 'CREDIT_POINTS';
            } else if (promoType == 'GIFT_WITH_PURCHASE') {
                p.Description = 'We miss you! Enjoy a complimentary gift with your next order.';
                p.FulfillmentAction = 'ISSUE_VOUCHER';
            } else {
                // DISCOUNT
                p.Description = 'Welcome back! Enjoy a special discount on your next order.';
                p.FulfillmentAction = 'ISSUE_VOUCHER';
            }

            p.Objective = 'Winback at-risk high-value customer. ' +
                'Tier: ' + c.loyaltyTier + '. LTV: $' + c.lifetimeValue +
                '. Days since purchase: ' + c.daysSinceLastPurchase;

            promotions.add(p);
            contactPromoMap.put(c.contactId, p);
        }

        insert promotions;

        // Enroll each member in their promotion
        List<LoyaltyProgramMbrPromotion> enrollments = new List<LoyaltyProgramMbrPromotion>();
        for (AtRiskCustomer c : customers) {
            Promotion p = contactPromoMap.get(c.contactId);
            if (p != null && p.Id != null) {
                LoyaltyProgramMbrPromotion mbp = new LoyaltyProgramMbrPromotion();
                mbp.LoyaltyProgramMemberId = c.loyaltyMemberId;
                mbp.PromotionId = p.Id;
                enrollments.add(mbp);
            }
        }

        if (!enrollments.isEmpty()) {
            Database.insert(enrollments, false);
        }

        return promotions.size();
    }

    // ─── 3. Hero Variations ─────────────────────────────────────────────────

    private static Integer createHeroVariations(List<AtRiskCustomer> customers, String promoType, WinbackRequest req, Integer durationDays) {
        List<Personalization_Variation__c> variations = new List<Personalization_Variation__c>();

        for (AtRiskCustomer c : customers) {
            String headline = 'Welcome Back, ' + (c.contactName.contains(' ') ? c.contactName.split(' ')[0] : c.contactName);
            String body = '';
            String badge = 'VIP Exclusive';

            if (promoType == 'BONUS_POINTS') {
                Integer pts = req.bonusPoints != null ? req.bonusPoints : 500;
                body = pts + ' bonus points are waiting for you on your next order.';
            } else if (promoType == 'POINT_MULTIPLIER') {
                Integer mult = req.pointMultiplier != null ? req.pointMultiplier : 2;
                body = 'Earn ' + mult + 'x points on everything for the next ' + durationDays + ' days.';
            } else if (promoType == 'GIFT_WITH_PURCHASE') {
                body = 'A complimentary gift is waiting with your next order.';
            } else {
                body = 'A special offer has been reserved just for you.';
            }

            Map<String, Object> content = new Map<String, Object>{
                'badge' => badge,
                'header_text' => headline + '\nWe Missed You',
                'body_text' => body,
                'cta' => 'Explore Your Offer',
                'winback' => true,
                'contact_id' => String.valueOf(c.contactId)
            };

            // Target this specific contact
            Map<String, Object> rules = new Map<String, Object>{
                'contact_id' => String.valueOf(c.contactId)
            };

            Personalization_Variation__c v = new Personalization_Variation__c(
                Point_Name__c = 'Hero_Banner',
                Variation_Name__c = 'Winback: ' + c.contactName,
                Content_JSON__c = JSON.serialize(content),
                Segment_Rules__c = JSON.serialize(rules),
                Priority__c = 400, // Highest priority — 1:1 winback
                Is_Active__c = true,
                Channel__c = 'Web',
                Created_By_API__c = true,
                Start_Date__c = Datetime.now(),
                End_Date__c = Datetime.now().addDays(durationDays)
            );
            variations.add(v);
        }

        if (!variations.isEmpty()) {
            insert variations;
        }
        return variations.size();
    }

    // ─── 4. Journey Approvals ───────────────────────────────────────────────

    private static Integer createWinbackJourneys(List<AtRiskCustomer> customers, String promoType, WinbackRequest req, Integer durationDays) {
        List<Journey_Approval__c> approvals = new List<Journey_Approval__c>();
        Integer pts = req.bonusPoints != null ? req.bonusPoints : 500;
        Integer mult = req.pointMultiplier != null ? req.pointMultiplier : 2;

        for (AtRiskCustomer c : customers) {
            String journeyId = 'WB-' + String.valueOf(c.contactId).right(8) + '-' + String.valueOf(Datetime.now().getTime()).right(6);

            // Step 1: Email (Day 0)
            String subject = 'We miss you, ' + (c.contactName.contains(' ') ? c.contactName.split(' ')[0] : c.contactName) + '!';
            String body = '';
            if (promoType == 'BONUS_POINTS') {
                body = 'As one of our most valued customers, we\'ve added ' + pts + ' bonus points to your account. ' +
                    'Shop now and they\'ll be credited with your next purchase.';
            } else if (promoType == 'POINT_MULTIPLIER') {
                body = 'For the next ' + durationDays + ' days, you\'ll earn ' + mult + 'x points on every purchase. ' +
                    'It\'s our way of saying we appreciate you.';
            } else if (promoType == 'GIFT_WITH_PURCHASE') {
                body = 'A complimentary gift has been reserved in your name. Place any order in the next ' +
                    durationDays + ' days and it\'s yours.';
            } else {
                body = 'We\'ve prepared a special offer just for you. Come back and see what\'s new.';
            }

            Journey_Approval__c email1 = new Journey_Approval__c(
                Journey_Id__c = journeyId,
                Contact__c = c.contactId,
                Step_Number__c = 1,
                Total_Steps__c = 2,
                Channel__c = 'Email',
                Send_Delay_Days__c = 0,
                Suggested_Subject__c = subject,
                Suggested_Body__c = body,
                Status__c = 'Pending',
                Event_Type__c = 'winback-promotion',
                Event_Summary__c = 'Winback: ' + c.contactName + ' (' + c.loyaltyTier + ', $' + c.lifetimeValue + ' LTV)',
                Urgency__c = 'Immediate',
                Confidence_Score__c = 90
            );
            approvals.add(email1);

            // Step 2: Reminder email (Day 5)
            Journey_Approval__c email2 = new Journey_Approval__c(
                Journey_Id__c = journeyId,
                Contact__c = c.contactId,
                Step_Number__c = 2,
                Total_Steps__c = 2,
                Channel__c = 'Email',
                Send_Delay_Days__c = 5,
                Suggested_Subject__c = 'Your ' + (promoType == 'BONUS_POINTS' ? pts + ' bonus points expire' :
                    promoType == 'POINT_MULTIPLIER' ? mult + 'x points window is closing' :
                    promoType == 'GIFT_WITH_PURCHASE' ? 'gift is still waiting' : 'offer expires') + ' soon',
                Suggested_Body__c = 'Just a reminder — your exclusive ' + promoType.replace('_', ' ').toLowerCase() +
                    ' promotion ends in ' + (durationDays - 5) + ' days. Don\'t miss out.',
                Status__c = 'Pending',
                Event_Type__c = 'winback-promotion',
                Event_Summary__c = 'Winback reminder: ' + c.contactName,
                Urgency__c = 'Future',
                Confidence_Score__c = 90
            );
            approvals.add(email2);
        }

        if (!approvals.isEmpty()) {
            insert approvals;
        }
        return approvals.size() / 2; // Return journey count, not step count
    }
}
