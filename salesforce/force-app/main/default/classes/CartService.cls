/**
 * CartService — REST API for cart persistence from the web storefront.
 *
 * Endpoints (via proxy at /api/sf/cart):
 *   POST   /services/apexrest/cart/upsert   — Create or update a cart
 *   POST   /services/apexrest/cart/convert   — Mark cart as converted (purchase completed)
 *   GET    /services/apexrest/cart?sessionId= — Get active cart by session ID
 */
@RestResource(urlMapping='/cart/*')
global with sharing class CartService {

    @HttpPost
    global static Map<String, Object> handlePost() {
        RestRequest req = RestContext.request;
        String path = req.requestURI.substringAfterLast('/cart/');
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());

        if (path == 'upsert') {
            return upsertCart(body);
        } else if (path == 'convert') {
            return convertCart(body);
        }
        return new Map<String, Object>{ 'error' => 'Unknown action: ' + path };
    }

    @HttpGet
    global static Map<String, Object> handleGet() {
        String sessionId = RestContext.request.params.get('sessionId');
        if (String.isBlank(sessionId)) {
            return new Map<String, Object>{ 'error' => 'sessionId required' };
        }
        List<Cart__c> carts = [
            SELECT Id, Contact__c, Cart_Items_JSON__c, Subtotal__c, Items_Count__c,
                   Status__c, Session_Id__c, Last_Updated__c
            FROM Cart__c
            WHERE Session_Id__c = :sessionId AND Status__c = 'Active'
            ORDER BY Last_Updated__c DESC
            LIMIT 1
        ];
        if (carts.isEmpty()) {
            return new Map<String, Object>{ 'found' => false };
        }
        Cart__c c = carts[0];
        return new Map<String, Object>{
            'found' => true,
            'cartId' => c.Id,
            'items' => c.Cart_Items_JSON__c,
            'subtotal' => c.Subtotal__c,
            'itemsCount' => c.Items_Count__c,
            'status' => c.Status__c
        };
    }

    /**
     * Upsert a cart — creates or updates based on sessionId.
     * Body: { sessionId, contactId?, items: [{productId, name, quantity, price}], subtotal }
     */
    private static Map<String, Object> upsertCart(Map<String, Object> body) {
        String sessionId = (String) body.get('sessionId');
        String contactId = (String) body.get('contactId');
        String itemsJson = JSON.serialize(body.get('items'));
        Decimal subtotal = body.get('subtotal') != null ? Decimal.valueOf(String.valueOf(body.get('subtotal'))) : 0;
        List<Object> items = (List<Object>) body.get('items');
        Integer itemsCount = items != null ? items.size() : 0;

        // Find existing active cart for this session
        List<Cart__c> existing = [
            SELECT Id FROM Cart__c
            WHERE Session_Id__c = :sessionId AND Status__c = 'Active'
            LIMIT 1
        ];

        Cart__c cart;
        if (!existing.isEmpty()) {
            cart = existing[0];
        } else {
            cart = new Cart__c();
            cart.Session_Id__c = sessionId;
        }

        cart.Cart_Items_JSON__c = itemsJson;
        cart.Subtotal__c = subtotal;
        cart.Items_Count__c = itemsCount;
        cart.Status__c = 'Active';
        cart.Last_Updated__c = DateTime.now();

        if (String.isNotBlank(contactId)) {
            try {
                cart.Contact__c = Id.valueOf(contactId);
            } catch (Exception e) {
                // contactId might be an email — try to resolve
                List<Contact> contacts = [SELECT Id FROM Contact WHERE Email = :contactId LIMIT 1];
                if (!contacts.isEmpty()) {
                    cart.Contact__c = contacts[0].Id;
                }
            }
        }

        upsert cart;
        return new Map<String, Object>{ 'success' => true, 'cartId' => cart.Id };
    }

    /**
     * Convert a cart — marks as Converted when purchase completes.
     * Body: { sessionId OR cartId, orderId? }
     */
    private static Map<String, Object> convertCart(Map<String, Object> body) {
        String sessionId = (String) body.get('sessionId');
        String cartId = (String) body.get('cartId');

        List<Cart__c> carts;
        if (String.isNotBlank(cartId)) {
            carts = [SELECT Id FROM Cart__c WHERE Id = :cartId AND Status__c = 'Active'];
        } else if (String.isNotBlank(sessionId)) {
            carts = [SELECT Id FROM Cart__c WHERE Session_Id__c = :sessionId AND Status__c = 'Active'];
        } else {
            return new Map<String, Object>{ 'error' => 'sessionId or cartId required' };
        }

        for (Cart__c c : carts) {
            c.Status__c = 'Converted';
        }
        if (!carts.isEmpty()) update carts;

        return new Map<String, Object>{ 'success' => true, 'converted' => carts.size() };
    }
}
