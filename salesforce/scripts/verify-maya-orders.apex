// Verify Maya's orders post-fix
Id MAYA_ID = '003Ka00003xPb09IAC';
Contact mayaC = [SELECT Id, AccountId FROM Contact WHERE Id = :MAYA_ID LIMIT 1];

for (Order o : [
  SELECT Id, OrderNumber, TotalAmount, EffectiveDate, Status,
         (SELECT Product2.Name, Quantity, UnitPrice FROM OrderItems)
    FROM Order WHERE AccountId = :mayaC.AccountId
   ORDER BY EffectiveDate DESC
]) {
  System.debug('Order ' + o.OrderNumber + ' (' + o.EffectiveDate + ') TotalAmount=$' + o.TotalAmount);
  for (OrderItem li : o.OrderItems) {
    System.debug('   - ' + li.Product2.Name + ' qty=' + li.Quantity + ' @ $' + li.UnitPrice);
  }
}
