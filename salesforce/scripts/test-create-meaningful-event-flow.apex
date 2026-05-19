// Invoke Create_Meaningful_Event directly with Maya's contactId and
// inspect what it returns. This isolates whether the FLOW works when
// given clean inputs (so we know whether the bug is in the agent's
// invocation vs the flow itself).

Map<String, Object> inputs = new Map<String, Object>{
  'contactId'        => '003Ka00003xPb09IAC',  // Maya
  'eventDescription' => 'TEST INVOCATION: wedding planning',
  'eventType'        => 'wedding',
  'urgency'          => 'No Date',
  'eventDate'        => null,
  'metadataJson'     => '{"source":"direct test"}'
};

Flow.Interview.Create_Meaningful_Event flow =
  new Flow.Interview.Create_Meaningful_Event(inputs);

try {
  flow.start();

  Boolean success = (Boolean) flow.getVariableValue('outputSuccess');
  String  message = (String)  flow.getVariableValue('outputMessage');
  String  err     = (String)  flow.getVariableValue('outputError');
  String  recId   = (String)  flow.getVariableValue('outputRecordId');

  System.debug('── Flow output ──');
  System.debug('  outputSuccess = ' + success);
  System.debug('  outputMessage = ' + message);
  System.debug('  outputError   = ' + err);
  System.debug('  outputRecordId = ' + recId);
} catch (Exception e) {
  System.debug('FLOW THREW: ' + e.getTypeName() + ': ' + e.getMessage());
}
