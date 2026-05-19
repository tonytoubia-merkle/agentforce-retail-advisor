// Inspect the Beauty Concierge agent's currently-deployed topics and which
// actions each topic exposes. This tells us whether Create_Meaningful_Event
// is actually wired up at runtime, vs only declared in the repo's agent
// script file (which the Agent Builder Studio UI can override).

System.debug('── GenAiPlanner records ──');
for (GenAiPlanner__mdt p : [
  SELECT MasterLabel, DeveloperName FROM GenAiPlanner__mdt LIMIT 20
]) {
  System.debug('  planner ' + p.DeveloperName + ' (' + p.MasterLabel + ')');
}

System.debug('── GenAiPlugin records (topics) ──');
for (GenAiPlugin__mdt t : [
  SELECT MasterLabel, DeveloperName, Description FROM GenAiPlugin__mdt LIMIT 50
]) {
  System.debug('  topic ' + t.DeveloperName + ' | ' + t.Description);
}

System.debug('── GenAiPluginFunction (actions linked to topics) ──');
for (GenAiPluginFunction__mdt f : [
  SELECT MasterLabel, DeveloperName, GenAiPlugin__r.DeveloperName,
         GenAiFunctionDef__r.DeveloperName, GenAiFunctionDef__r.MasterLabel
    FROM GenAiPluginFunction__mdt
   WHERE GenAiFunctionDef__r.DeveloperName LIKE '%Meaningful%'
      OR MasterLabel LIKE '%Meaningful%'
   LIMIT 30
]) {
  System.debug(
    '  topic=' + f.GenAiPlugin__r.DeveloperName +
    ' action=' + f.GenAiFunctionDef__r.DeveloperName +
    ' (' + f.GenAiFunctionDef__r.MasterLabel + ')'
  );
}
