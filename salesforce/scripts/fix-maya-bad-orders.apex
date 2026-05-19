// fix-maya-bad-orders.apex
//
// One-off cleanup: Maya Thompson's account has at least one Order whose
// TotalAmount is wildly unrealistic for the Beauté catalog (visible in the
// SPA's Demo / Identity panel as
//   "Maintenance Bundle, Daily Defense Moisturizer SPF 30 — $20,422").
//
// This Apex script finds every Order under Maya's Account whose
// TotalAmount exceeds a sane sanity threshold ($500 — the most expensive
// piece in our catalog is the Jardin de Nuit eau de parfum at $125, and
// even a 4-item luxury basket caps around $400) and either:
//   1. Deletes its OrderItems + the Order (preferred — clean removal)
//   2. Optionally re-prices the OrderItem(s) to a sensible value if you
//      want to KEEP the order shell for journey/segment continuity
//
// Run via:
//   sf apex run -f salesforce/scripts/fix-maya-bad-orders.apex --target-org my-org
//
// To re-price instead of delete, flip DRY_RUN to true to inspect first,
// then change MODE = 'REPRICE' below.

// Re-priced Order 00000346 on 2026-05-08; defaults restored to DRY_RUN
// so any future re-run requires an explicit opt-in to mutate.
Boolean DRY_RUN = true;
String  MODE    = 'REPRICE'; // 'DELETE' or 'REPRICE'
Decimal SANITY_THRESHOLD = 500.00;

Id MAYA_CONTACT = '003Ka00003xPb09IAC';

Contact maya = [SELECT Id, AccountId, Email, Name FROM Contact WHERE Id = :MAYA_CONTACT LIMIT 1];
System.debug('Maya: ' + maya.Name + ' / Account ' + maya.AccountId);

List<Order> badOrders = [
  SELECT Id, OrderNumber, EffectiveDate, TotalAmount, Status,
         (SELECT Id, Product2.Name, Quantity, UnitPrice FROM OrderItems)
    FROM Order
   WHERE AccountId = :maya.AccountId
     AND TotalAmount > :SANITY_THRESHOLD
   ORDER BY TotalAmount DESC
];

System.debug('Bad orders found: ' + badOrders.size());
for (Order o : badOrders) {
  System.debug('  ' + o.OrderNumber + ' (' + o.EffectiveDate + ') TotalAmount=$' + o.TotalAmount + ' status=' + o.Status);
  for (OrderItem li : o.OrderItems) {
    System.debug('     - ' + li.Product2.Name + ' qty=' + li.Quantity + ' @ $' + li.UnitPrice);
  }
}

if (DRY_RUN) {
  System.debug('DRY_RUN=true — no changes made. Set DRY_RUN=false and re-run to apply.');
  return;
}

if (badOrders.isEmpty()) {
  System.debug('Nothing to clean. Done.');
  return;
}

if (MODE == 'DELETE') {
  // Orders in 'Activated' status must be marked Draft before deletion.
  List<Order> toReset = new List<Order>();
  for (Order o : badOrders) {
    if (o.Status != 'Draft') {
      toReset.add(new Order(Id = o.Id, Status = 'Draft'));
    }
  }
  if (!toReset.isEmpty()) {
    update toReset;
    System.debug('Reset ' + toReset.size() + ' orders to Draft.');
  }
  // Collect line item ids
  List<OrderItem> lineItems = new List<OrderItem>();
  for (Order o : badOrders) {
    lineItems.addAll(o.OrderItems);
  }
  if (!lineItems.isEmpty()) {
    delete lineItems;
    System.debug('Deleted ' + lineItems.size() + ' OrderItems.');
  }
  delete badOrders;
  System.debug('Deleted ' + badOrders.size() + ' Orders. Done.');
} else if (MODE == 'REPRICE') {
  // Cap UnitPrice at $99 (sensible mid-range for the Beauté catalog).
  // Order TotalAmount is auto-recalculated by Salesforce on OrderItem update.
  List<OrderItem> reprice = new List<OrderItem>();
  for (Order o : badOrders) {
    for (OrderItem li : o.OrderItems) {
      if (li.UnitPrice > 200) {
        reprice.add(new OrderItem(Id = li.Id, UnitPrice = 49.00, Quantity = 1));
      }
    }
  }
  if (!reprice.isEmpty()) {
    update reprice;
    System.debug('Re-priced ' + reprice.size() + ' OrderItems to $49 / qty 1.');
  }
}
