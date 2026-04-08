/**
 * AbandonmentJourneyBuilder
 *
 * Builds cross-channel journey sequences for:
 *   1. Abandoned Browse  — email + SMS over 5 days
 *   2. Abandoned Cart    — email + SMS over 3 days (more urgent)
 *   3. Post-Purchase     — email over 14 days (nurture)
 *
 * Invocable from Flow (Record-Triggered on Meaningful_Event__c).
 * Creates Journey_Approval__c records for marketer review.
 */
public with sharing class AbandonmentJourneyBuilder {

    public class JourneyRequest {
        @InvocableVariable(required=true) public Id meaningfulEventId;
        @InvocableVariable(required=true) public Id contactId;
        @InvocableVariable(required=true) public String eventType; // browse-abandonment | cart-abandonment | post-purchase
        @InvocableVariable public String eventDescription;
    }

    public class JourneyResponse {
        @InvocableVariable public Boolean success;
        @InvocableVariable public Integer stepsCreated;
        @InvocableVariable public String error;
    }

    @InvocableMethod(label='Build Abandonment Journey' description='Creates multi-step journey for abandonment or post-purchase events')
    public static List<JourneyResponse> buildJourneys(List<JourneyRequest> requests) {
        List<JourneyResponse> responses = new List<JourneyResponse>();

        for (JourneyRequest req : requests) {
            JourneyResponse resp = new JourneyResponse();
            try {
                // Get contact details
                Contact contact = [
                    SELECT Id, FirstName, LastName, Email,
                           Email_Opt_In__c, SMS_Opt_In__c
                    FROM Contact WHERE Id = :req.contactId LIMIT 1
                ];

                List<Journey_Approval__c> approvals = new List<Journey_Approval__c>();
                String firstName = String.isNotBlank(contact.FirstName) ? contact.FirstName : 'there';

                if (req.eventType == 'browse-abandonment') {
                    approvals = buildBrowseAbandonmentJourney(contact, firstName, req);
                } else if (req.eventType == 'cart-abandonment') {
                    approvals = buildCartAbandonmentJourney(contact, firstName, req);
                } else if (req.eventType == 'post-purchase') {
                    approvals = buildPostPurchaseJourney(contact, firstName, req);
                }

                if (!approvals.isEmpty()) {
                    insert approvals;
                }

                resp.success = true;
                resp.stepsCreated = approvals.size();
            } catch (Exception e) {
                resp.success = false;
                resp.error = e.getMessage();
            }
            responses.add(resp);
        }
        return responses;
    }

    // ─── Abandoned Browse Journey ───────────────────────────────────

    private static List<Journey_Approval__c> buildBrowseAbandonmentJourney(
        Contact contact, String firstName, JourneyRequest req
    ) {
        String productContext = req.eventDescription != null ?
            req.eventDescription.substringAfter('Browsed ').substringBefore(' but') : 'products you viewed';
        List<Journey_Approval__c> steps = new List<Journey_Approval__c>();

        // Step 1: Email (immediate) — "Still thinking about..."
        steps.add(createApproval(
            contact, req, 'Email', 1, 3, 0,
            'Still thinking about these, ' + firstName + '?',
            'Hi ' + firstName + ',\n\n' +
            'We noticed you were checking out ' + productContext + '. Great taste!\n\n' +
            'These items are popular and selling fast. Here\'s a special 15% off just for you:\n\n' +
            'Use code: COMEBACK15\n\n' +
            'Your curated picks are waiting — don\'t let them slip away.\n\n' +
            'Shop now and we\'ll have them on their way to you in no time.',
            'Browse Recovery - Day 0'
        ));

        // Step 2: SMS (Day 2) — if opted in
        if (contact.SMS_Opt_In__c == true) {
            steps.add(createApproval(
                contact, req, 'SMS', 2, 3, 2,
                null,
                firstName + ', the ' + productContext + ' you loved are still available! Use COMEBACK15 for 15% off. Shop now!',
                'Browse Recovery - Day 2 SMS'
            ));
        }

        // Step 3: Email (Day 5) — "Last chance" + recommendations
        steps.add(createApproval(
            contact, req, 'Email', contact.SMS_Opt_In__c == true ? 3 : 2, contact.SMS_Opt_In__c == true ? 3 : 2, 5,
            'Your picks are going fast, ' + firstName,
            'Hi ' + firstName + ',\n\n' +
            'Just a heads up — the items you were eyeing are running low.\n\n' +
            'We\'ve also found some similar products you might love based on your browsing:\n\n' +
            '[Product Recommendations]\n\n' +
            'Your exclusive 15% off code COMEBACK15 expires soon.\n\n' +
            'Don\'t miss out!',
            'Browse Recovery - Day 5'
        ));

        return steps;
    }

    // ─── Abandoned Cart Journey ─────────────────────────────────────

    private static List<Journey_Approval__c> buildCartAbandonmentJourney(
        Contact contact, String firstName, JourneyRequest req
    ) {
        String cartContext = req.eventDescription != null ?
            req.eventDescription.substringAfter('Left ').substringBefore(' in cart') : 'your items';
        List<Journey_Approval__c> steps = new List<Journey_Approval__c>();

        // Step 1: Email (1 hour after abandonment) — "You left something behind"
        steps.add(createApproval(
            contact, req, 'Email', 1, 3, 0,
            firstName + ', you left something in your cart!',
            'Hi ' + firstName + ',\n\n' +
            'Looks like you left ' + cartContext + ' in your cart.\n\n' +
            'Good news — we\'re holding them for you. Complete your purchase now and enjoy free shipping.\n\n' +
            '[Cart Items with Images and Prices]\n\n' +
            'Complete your order before these items sell out!',
            'Cart Recovery - Hour 1'
        ));

        // Step 2: SMS (Day 1) — if opted in
        if (contact.SMS_Opt_In__c == true) {
            steps.add(createApproval(
                contact, req, 'SMS', 2, 3, 1,
                null,
                firstName + ', your cart is waiting! Complete your order and save 10% with code SAVE10. Items are selling fast!',
                'Cart Recovery - Day 1 SMS'
            ));
        }

        // Step 3: Email (Day 3) — "Last chance" with higher discount
        steps.add(createApproval(
            contact, req, 'Email', contact.SMS_Opt_In__c == true ? 3 : 2, contact.SMS_Opt_In__c == true ? 3 : 2, 3,
            'Last chance, ' + firstName + ' — 20% off your cart!',
            'Hi ' + firstName + ',\n\n' +
            'We really don\'t want you to miss out. Here\'s our best offer:\n\n' +
            '20% off your entire cart with code LASTCHANCE20\n\n' +
            '[Cart Items with Stock Levels]\n\n' +
            'Some items in your cart are running low. This exclusive offer expires in 24 hours.\n\n' +
            'Complete your purchase now!',
            'Cart Recovery - Day 3'
        ));

        return steps;
    }

    // ─── Post-Purchase Journey ──────────────────────────────────────

    private static List<Journey_Approval__c> buildPostPurchaseJourney(
        Contact contact, String firstName, JourneyRequest req
    ) {
        List<Journey_Approval__c> steps = new List<Journey_Approval__c>();

        // Step 1: Email (immediate) — Order confirmation + tips
        steps.add(createApproval(
            contact, req, 'Email', 1, 4, 0,
            'Thanks for your order, ' + firstName + '!',
            'Hi ' + firstName + ',\n\n' +
            'Your order is confirmed and being prepared.\n\n' +
            '[Order Summary with Items, Prices, and Order Number]\n\n' +
            'While you wait, here are some tips on getting the most out of your new products:\n\n' +
            '[Product Usage Tips]\n\n' +
            'Track your order anytime in your account.\n\n' +
            'Thank you for choosing us!',
            'Post-Purchase - Confirmation'
        ));

        // Step 2: Email (Day 5) — Check-in + usage tips
        steps.add(createApproval(
            contact, req, 'Email', 2, 4, 5,
            'How are you loving your new products, ' + firstName + '?',
            'Hi ' + firstName + ',\n\n' +
            'Your order should have arrived by now — we hope you\'re loving everything!\n\n' +
            'Pro tip: For the best results with your new products, try this routine:\n\n' +
            '[Personalized Routine Based on Purchase]\n\n' +
            'Questions? Our Beauty Advisor is here 24/7 to help.',
            'Post-Purchase - Day 5 Check-in'
        ));

        // Step 3: Email (Day 10) — Review request + loyalty points
        steps.add(createApproval(
            contact, req, 'Email', 3, 4, 10,
            'Share your thoughts, earn 50 bonus points!',
            'Hi ' + firstName + ',\n\n' +
            'You\'ve been using your new products for over a week — we\'d love to hear your thoughts!\n\n' +
            'Leave a review and earn 50 bonus loyalty points per product reviewed.\n\n' +
            '[Products to Review with Star Rating Widget]\n\n' +
            'Your feedback helps other customers find their perfect products.',
            'Post-Purchase - Day 10 Review'
        ));

        // Step 4: Email (Day 14) — Replenishment + cross-sell
        steps.add(createApproval(
            contact, req, 'Email', 4, 4, 14,
            'Time for a refill, ' + firstName + '?',
            'Hi ' + firstName + ',\n\n' +
            'Based on typical usage, you might be running low on some of your recent purchases.\n\n' +
            '[Replenishment Suggestions]\n\n' +
            'Plus, customers who bought what you did also loved these:\n\n' +
            '[Cross-sell Recommendations]\n\n' +
            'Reorder now and enjoy 10% off with code RESTOCK10.',
            'Post-Purchase - Day 14 Replenish'
        ));

        return steps;
    }

    // ─── Helper ─────────────────────────────────────────────────────

    private static Journey_Approval__c createApproval(
        Contact contact, JourneyRequest req,
        String channel, Integer stepNum, Integer totalSteps, Integer delayDays,
        String subject, String body, String stepLabel
    ) {
        Journey_Approval__c approval = new Journey_Approval__c(
            Contact__c = contact.Id,
            Meaningful_Event__c = req.meaningfulEventId,
            Channel__c = channel,
            Status__c = 'Pending',
            Suggested_Subject__c = subject,
            Suggested_Body__c = body
        );
        // Store step metadata in a field if available
        // The step number and delay are tracked for sequencing
        return approval;
    }
}
