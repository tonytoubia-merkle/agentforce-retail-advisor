/**
 * ChatSummaryService - Invocable Apex action for generating and storing
 * chat summaries post-conversation. Called by Agentforce topics or flows.
 *
 * Uses the conversation transcript to produce a structured summary with
 * sentiment analysis and topic extraction, then persists to Data Cloud
 * via DataCloudProfileService.
 */
global with sharing class ChatSummaryService {

    public class ChatSummaryRequest {
        @InvocableVariable(required=true label='Conversation Transcript')
        public String conversationTranscript;

        @InvocableVariable(required=true label='Customer ID')
        public String customerId;

        @InvocableVariable(required=true label='Session ID')
        public String sessionId;
    }

    public class ChatSummaryResult {
        @InvocableVariable
        public Boolean success;

        @InvocableVariable
        public String summaryJson;

        @InvocableVariable
        public String errorMessage;
    }

    @InvocableMethod(label='Generate Chat Summary' description='Generates a structured summary of the conversation and stores it in Data Cloud')
    public static List<ChatSummaryResult> generateChatSummary(List<ChatSummaryRequest> requests) {
        List<ChatSummaryResult> results = new List<ChatSummaryResult>();

        for (ChatSummaryRequest req : requests) {
            ChatSummaryResult result = new ChatSummaryResult();
            try {
                // Extract summary components from transcript
                String summary = extractSummary(req.conversationTranscript);
                String sentiment = analyzeSentiment(req.conversationTranscript);
                String topics = extractTopics(req.conversationTranscript);
                String sessionDate = String.valueOf(Date.today());

                // Persist to Data Cloud
                DataCloudProfileService.writeChatSummary(
                    req.customerId, req.sessionId,
                    sessionDate, summary, sentiment, topics
                );

                // Build result JSON
                Map<String, Object> summaryMap = new Map<String, Object>();
                summaryMap.put('sessionDate', sessionDate);
                summaryMap.put('summary', summary);
                summaryMap.put('sentiment', sentiment);
                summaryMap.put('topicsDiscussed', topics.split(';'));

                result.success = true;
                result.summaryJson = JSON.serialize(summaryMap);
            } catch (Exception e) {
                result.success = false;
                result.errorMessage = e.getMessage();
            }
            results.add(result);
        }

        return results;
    }

    /**
     * Extract a concise summary from the conversation transcript.
     * In production, this would call Einstein GPT or an external LLM.
     * This implementation uses keyword-based extraction as a fallback.
     */
    private static String extractSummary(String transcript) {
        if (String.isBlank(transcript)) {
            return 'No conversation content to summarize.';
        }

        // Count exchanges
        Integer customerMessages = transcript.countMatches('Customer:');
        Integer agentMessages = transcript.countMatches('Agent:');

        // Extract key phrases
        List<String> summaryParts = new List<String>();
        summaryParts.add('Customer had ' + customerMessages + ' messages in this session.');

        // Look for product mentions
        if (transcript.containsIgnoreCase('moisturizer') || transcript.containsIgnoreCase('serum') ||
            transcript.containsIgnoreCase('cleanser') || transcript.containsIgnoreCase('sunscreen')) {
            summaryParts.add('Discussed skincare products.');
        }
        if (transcript.containsIgnoreCase('travel')) {
            summaryParts.add('Discussed travel-related products.');
        }
        if (transcript.containsIgnoreCase('gift') || transcript.containsIgnoreCase('anniversary') ||
            transcript.containsIgnoreCase('birthday')) {
            summaryParts.add('Discussed gifting or special occasions.');
        }
        if (transcript.containsIgnoreCase('checkout') || transcript.containsIgnoreCase('buy') ||
            transcript.containsIgnoreCase('purchase')) {
            summaryParts.add('Showed purchase intent.');
        }
        if (transcript.containsIgnoreCase('routine')) {
            summaryParts.add('Discussed skincare routine.');
        }

        return String.join(summaryParts, ' ');
    }

    /**
     * Analyze conversation sentiment.
     * In production, use Einstein Sentiment or external NLP API.
     */
    private static String analyzeSentiment(String transcript) {
        if (String.isBlank(transcript)) return 'neutral';

        String lower = transcript.toLowerCase();
        Integer positiveSignals = 0;
        Integer negativeSignals = 0;

        // Positive indicators
        if (lower.contains('love')) positiveSignals++;
        if (lower.contains('great')) positiveSignals++;
        if (lower.contains('perfect')) positiveSignals++;
        if (lower.contains('thank')) positiveSignals++;
        if (lower.contains('amazing')) positiveSignals++;
        if (lower.contains('excited')) positiveSignals++;

        // Negative indicators
        if (lower.contains('problem')) negativeSignals++;
        if (lower.contains('issue')) negativeSignals++;
        if (lower.contains('disappointed')) negativeSignals++;
        if (lower.contains('return')) negativeSignals++;
        if (lower.contains('complaint')) negativeSignals++;
        if (lower.contains('frustrated')) negativeSignals++;

        if (positiveSignals > negativeSignals + 1) return 'positive';
        if (negativeSignals > positiveSignals + 1) return 'negative';
        return 'neutral';
    }

    /**
     * Extract topics discussed from the transcript.
     * Returns semicolon-separated topic list.
     */
    private static String extractTopics(String transcript) {
        if (String.isBlank(transcript)) return 'general inquiry';

        String lower = transcript.toLowerCase();
        List<String> topics = new List<String>();

        if (lower.contains('moisturizer') || lower.contains('hydrat')) topics.add('moisturizer');
        if (lower.contains('serum') || lower.contains('retinol') || lower.contains('vitamin c')) topics.add('serum');
        if (lower.contains('cleanser') || lower.contains('wash')) topics.add('cleanser');
        if (lower.contains('sunscreen') || lower.contains('spf')) topics.add('sun protection');
        if (lower.contains('fragrance') || lower.contains('perfume') || lower.contains('cologne')) topics.add('fragrance');
        if (lower.contains('travel')) topics.add('travel');
        if (lower.contains('gift') || lower.contains('anniversary') || lower.contains('birthday')) topics.add('gifting');
        if (lower.contains('routine')) topics.add('skincare routine');
        if (lower.contains('sensitive') || lower.contains('allergy') || lower.contains('irritat')) topics.add('sensitive skin');
        if (lower.contains('acne') || lower.contains('breakout') || lower.contains('oily')) topics.add('acne care');
        if (lower.contains('anti-aging') || lower.contains('wrinkle') || lower.contains('fine line')) topics.add('anti-aging');
        if (lower.contains('checkout') || lower.contains('buy') || lower.contains('purchase')) topics.add('purchase intent');

        if (topics.isEmpty()) topics.add('general inquiry');

        return String.join(topics, ';');
    }
}
