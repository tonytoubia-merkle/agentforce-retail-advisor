/**
 * AbandonmentDetectionBatch
 *
 * Scheduled batch job that detects:
 *   1. Abandoned Browse — Browse_Session__c not followed by purchase within 2 hours
 *   2. Abandoned Cart   — Active carts not updated in 1+ hours
 *
 * For each abandoned session/cart, creates a Meaningful_Event__c record
 * which triggers the journey approval pipeline (MultiStepJourneyBuilder).
 *
 * Schedule: Run every hour
 *   System.schedule('Abandonment Detection', '0 0 * * * ?', new AbandonmentDetectionBatch());
 */
public class AbandonmentDetectionBatch implements Database.Batchable<SObject>, Schedulable {

    private String mode; // 'browse' or 'cart' or 'both'

    public AbandonmentDetectionBatch() {
        this.mode = 'both';
    }

    public AbandonmentDetectionBatch(String mode) {
        this.mode = mode;
    }

    // ─── Schedulable ────────────────────────────────────────────────

    public void execute(SchedulableContext sc) {
        Database.executeBatch(new AbandonmentDetectionBatch('browse'), 100);
        Database.executeBatch(new AbandonmentDetectionBatch('cart'), 100);
    }

    // ─── Batchable ──────────────────────────────────────────────────

    public Database.QueryLocator start(Database.BatchableContext bc) {
        if (mode == 'cart') {
            // Find active carts not updated in the last hour
            DateTime cutoff = DateTime.now().addHours(-1);
            return Database.getQueryLocator([
                SELECT Id, Contact__c, Cart_Items_JSON__c, Subtotal__c, Last_Updated__c
                FROM Cart__c
                WHERE Status__c = 'Active'
                  AND Last_Updated__c < :cutoff
                  AND Contact__c != null
                ORDER BY Last_Updated__c ASC
            ]);
        } else {
            // Find browse sessions from 2-48 hours ago with identified customers
            DateTime windowStart = DateTime.now().addHours(-48);
            DateTime windowEnd = DateTime.now().addHours(-2);
            return Database.getQueryLocator([
                SELECT Id, Customer_Id__c, Products_Viewed__c, Categories_Browsed__c,
                       Session_Date__c, Duration_Minutes__c, UTM_Campaign__c, UTM_Source__c
                FROM Browse_Session__c
                WHERE Session_Date__c >= :windowStart
                  AND Session_Date__c <= :windowEnd
                  AND Customer_Id__c != null
                  AND Products_Viewed__c != null
                ORDER BY Session_Date__c DESC
            ]);
        }
    }

    public void execute(Database.BatchableContext bc, List<SObject> scope) {
        if (mode == 'cart') {
            processAbandonedCarts((List<Cart__c>) scope);
        } else {
            processAbandonedBrowse((List<Browse_Session__c>) scope);
        }
    }

    public void finish(Database.BatchableContext bc) {
        // Logging only
        System.debug('[AbandonmentDetection] Batch complete for mode: ' + mode);
    }

    // ─── Abandoned Browse Processing ────────────────────────────────

    private void processAbandonedBrowse(List<Browse_Session__c> sessions) {
        // Collect customer IDs to check for recent purchases
        Set<String> customerIds = new Set<String>();
        for (Browse_Session__c s : sessions) {
            customerIds.add(s.Customer_Id__c);
        }

        // Find customers who purchased recently (exclude them)
        Set<Id> recentBuyers = new Set<Id>();
        for (Order o : [
            SELECT Account.PersonContactId
            FROM Order
            WHERE Status = 'Completed'
              AND CreatedDate >= LAST_N_DAYS:7
              AND Account.PersonContactId != null
        ]) {
            recentBuyers.add(o.Account.PersonContactId);
        }

        // Find existing abandonment events (prevent duplicates)
        Set<String> existingEvents = new Set<String>();
        for (Meaningful_Event__c me : [
            SELECT Description__c
            FROM Meaningful_Event__c
            WHERE Event_Type__c = 'browse-abandonment'
              AND Captured_At__c >= LAST_N_DAYS:3
        ]) {
            existingEvents.add(me.Description__c);
        }

        // Resolve customer IDs to Contact IDs
        Map<String, Id> customerToContact = resolveCustomerContacts(customerIds);

        List<Meaningful_Event__c> eventsToCreate = new List<Meaningful_Event__c>();
        List<Browse_Session__c> sessionsToUpdate = new List<Browse_Session__c>();

        for (Browse_Session__c session : sessions) {
            Id contactId = customerToContact.get(session.Customer_Id__c);
            if (contactId == null || recentBuyers.contains(contactId)) continue;

            String eventKey = 'browse-abandon:' + session.Customer_Id__c + ':' + String.valueOf(session.Session_Date__c).left(10);
            if (existingEvents.contains(eventKey)) continue;

            // Build product list for the event description
            String products = session.Products_Viewed__c != null ?
                session.Products_Viewed__c.replaceAll(';', ', ') : 'various products';
            String categories = session.Categories_Browsed__c != null ?
                session.Categories_Browsed__c.replaceAll(';', ', ') : '';

            Meaningful_Event__c event = new Meaningful_Event__c(
                Contact__c = contactId,
                Event_Type__c = 'browse-abandonment',
                Description__c = eventKey,
                Captured_At__c = DateTime.now(),
                Event_Date__c = Date.today(),
                Urgency__c = 'Immediate',
                Relative_Time_Text__c = 'Browsed ' + products +
                    (String.isNotBlank(categories) ? ' in ' + categories : '') +
                    ' but didn\'t purchase'
            );
            eventsToCreate.add(event);
        }

        if (!eventsToCreate.isEmpty()) {
            insert eventsToCreate;
            System.debug('[AbandonmentDetection] Created ' + eventsToCreate.size() + ' browse abandonment events');
        }
    }

    // ─── Abandoned Cart Processing ──────────────────────────────────

    private void processAbandonedCarts(List<Cart__c> carts) {
        // Find existing cart abandonment events (prevent duplicates)
        Set<Id> existingCartEvents = new Set<Id>();
        for (Meaningful_Event__c me : [
            SELECT Contact__c
            FROM Meaningful_Event__c
            WHERE Event_Type__c = 'cart-abandonment'
              AND Captured_At__c >= LAST_N_DAYS:3
        ]) {
            existingCartEvents.add(me.Contact__c);
        }

        List<Meaningful_Event__c> eventsToCreate = new List<Meaningful_Event__c>();
        List<Cart__c> cartsToUpdate = new List<Cart__c>();

        for (Cart__c cart : carts) {
            if (existingCartEvents.contains(cart.Contact__c)) continue;

            String itemsSummary = summarizeCartItems(cart.Cart_Items_JSON__c);

            Meaningful_Event__c event = new Meaningful_Event__c(
                Contact__c = cart.Contact__c,
                Event_Type__c = 'cart-abandonment',
                Description__c = 'cart-abandon:' + cart.Id,
                Captured_At__c = DateTime.now(),
                Event_Date__c = Date.today(),
                Urgency__c = 'Immediate',
                Relative_Time_Text__c = 'Left ' + itemsSummary +
                    ' in cart (total: $' + String.valueOf(cart.Subtotal__c) + ')'
            );
            eventsToCreate.add(event);

            cart.Status__c = 'Abandoned';
            cart.Abandoned_At__c = DateTime.now();
            cartsToUpdate.add(cart);
        }

        if (!eventsToCreate.isEmpty()) {
            insert eventsToCreate;
            System.debug('[AbandonmentDetection] Created ' + eventsToCreate.size() + ' cart abandonment events');
        }
        if (!cartsToUpdate.isEmpty()) {
            update cartsToUpdate;
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private Map<String, Id> resolveCustomerContacts(Set<String> customerIds) {
        Map<String, Id> result = new Map<String, Id>();
        for (Contact c : [
            SELECT Id, Email FROM Contact
            WHERE Email IN :customerIds OR Id IN :customerIds
        ]) {
            result.put(c.Email, c.Id);
            result.put(c.Id, c.Id);
        }
        return result;
    }

    private String summarizeCartItems(String cartJson) {
        if (String.isBlank(cartJson)) return 'items';
        try {
            List<Object> items = (List<Object>) JSON.deserializeUntyped(cartJson);
            if (items.size() == 1) {
                Map<String, Object> item = (Map<String, Object>) items[0];
                return String.valueOf(item.get('name'));
            }
            return items.size() + ' items';
        } catch (Exception e) {
            return 'items';
        }
    }
}
