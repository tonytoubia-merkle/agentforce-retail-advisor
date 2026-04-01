try {
    MarketingIntelligenceService.IntelligenceReport report =
        MarketingIntelligenceService.generateReport(7, null, null);
    System.debug('SUCCESS: ' + report.summary);
} catch (Exception e) {
    System.debug('ERROR: ' + e.getMessage());
    System.debug('STACK: ' + e.getStackTraceString());
}
