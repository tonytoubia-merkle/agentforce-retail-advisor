import { LightningElement, track, wire } from 'lwc';
import initSession from '@salesforce/apex/AgentCopilotService.initSession';
import sendMessage from '@salesforce/apex/AgentCopilotService.sendMessage';
import endSession from '@salesforce/apex/AgentCopilotService.endSession';
import getVariations from '@salesforce/apex/CampaignPlannerPageController.getActiveVariations';
import getJourneys from '@salesforce/apex/CampaignPlannerPageController.getCampaignJourneys';

const AGENT_TYPE = 'campaign-planner';

export default class CampaignPlannerPage extends LightningElement {
    @track messages = [];
    @track inputText = '';
    @track isSessionActive = false;
    @track isInitializing = false;
    @track isWaitingForResponse = false;
    @track error = null;
    @track variations = [];
    @track journeys = [];

    sessionId = null;
    sequenceId = 1;
    _messageCounter = 0;
    _refreshInterval = null;

    get quickActions() {
        return [
            { label: 'Analyze traffic trends', message: 'Analyze our traffic trends from the last 7 days. What sources are spiking and what are visitors browsing?' },
            { label: 'TikTok deep dive', message: 'Focus on TikTok traffic — what categories and products are trending? How do VIP visitors differ from general?' },
            { label: 'Create campaign', message: 'I want to create a new personalization campaign. Help me plan it based on current data.' },
            { label: 'Find at-risk VIPs', message: 'Identify at-risk high-value customers who haven\'t purchased in over a year. What winback promotions do you recommend?' },
            { label: 'Active campaigns', message: 'Show me all active personalization campaigns and their status.' }
        ];
    }

    get showStartPrompt() {
        return !this.isSessionActive && !this.isInitializing;
    }

    get isSendDisabled() {
        return !this.inputText || this.isWaitingForResponse;
    }

    get hasResults() {
        return this.variations.length > 0 || this.journeys.length > 0;
    }

    get hasVariations() {
        return this.variations.length > 0;
    }

    get variationCount() {
        return this.variations.length;
    }

    get hasJourneys() {
        return this.journeys.length > 0;
    }

    get journeyCount() {
        return this.journeys.length;
    }

    get showEmptyResults() {
        return !this.hasResults;
    }

    connectedCallback() {
        this.loadResults();
        // Auto-refresh results every 10 seconds while session is active
        this._refreshInterval = setInterval(() => {
            if (this.isSessionActive) {
                this.loadResults();
            }
        }, 10000);
    }

    disconnectedCallback() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
        }
        this.endCurrentSession();
    }

    // ─── Results Loading ────────────────────────────────────────────

    async loadResults() {
        try {
            const [vars, jrnys] = await Promise.all([
                getVariations(),
                getJourneys()
            ]);
            this.variations = (vars || []).map(v => ({
                ...v,
                statusLabel: v.Is_Active__c ? 'Active' : 'Inactive',
                statusClass: v.Is_Active__c ? 'status-badge status-active' : 'status-badge status-inactive'
            }));
            this.journeys = (jrnys || []).map(j => ({
                ...j,
                statusClass: j.Status__c === 'Pending' ? 'status-badge status-pending'
                    : j.Status__c === 'Sent' ? 'status-badge status-sent'
                    : 'status-badge status-other'
            }));
        } catch (err) {
            console.warn('Failed to load results:', err);
        }
    }

    handleRefreshResults() {
        this.loadResults();
    }

    // ─── Session ────────────────────────────────────────────────────

    async handleStartSession() {
        this.isInitializing = true;
        this.error = null;
        this.messages = [];
        this.sequenceId = 2;

        try {
            // Pass null contactId — campaign planner doesn't need a customer context
            const result = await initSession({ contactId: null, agentType: AGENT_TYPE });

            if (result.success) {
                this.sessionId = result.sessionId;
                this.isSessionActive = true;

                if (result.welcomeMessage) {
                    this.addMessage('agent', result.welcomeMessage);
                } else {
                    this.addMessage('agent', 'Campaign Planner ready. I can analyze marketing trends, create personalization campaigns, manage activations, and identify at-risk customers. What would you like to do?');
                }
            } else {
                this.error = result.errorMessage || 'Failed to start session';
            }
        } catch (err) {
            console.error('Session init error:', err);
            this.error = err.body?.message || err.message || 'Failed to start session';
        } finally {
            this.isInitializing = false;
        }
    }

    async endCurrentSession() {
        if (this.sessionId) {
            try {
                await endSession({ sessionId: this.sessionId });
            } catch (err) {
                console.warn('Session end error:', err);
            }
            this.sessionId = null;
            this.isSessionActive = false;
        }
    }

    // ─── Messaging ──────────────────────────────────────────────────

    async handleSend() {
        if (this.isSendDisabled || !this.sessionId) return;

        const text = this.inputText;
        this.inputText = '';
        this.addMessage('user', text);
        this.isWaitingForResponse = true;
        this.error = null;

        try {
            const result = await sendMessage({
                sessionId: this.sessionId,
                message: text,
                sequenceId: this.sequenceId++
            });

            if (result.success) {
                this.addMessage('agent', result.message);
                // Refresh results after agent response (may have created variations/flows)
                this.loadResults();
            } else {
                this.error = result.errorMessage || 'Failed to get response';
            }
        } catch (err) {
            console.error('Send message error:', err);
            this.error = err.body?.message || err.message || 'Failed to send message';
        } finally {
            this.isWaitingForResponse = false;
            this.scrollToBottom();
        }
    }

    addMessage(role, text) {
        const id = `msg-${++this._messageCounter}`;
        // Convert newlines + markdown-ish formatting to HTML
        const htmlText = (text || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');

        this.messages = [...this.messages, {
            id,
            role,
            htmlText,
            containerClass: `msg-container msg-${role}`,
            bubbleClass: `msg-bubble bubble-${role}`
        }];

        this.scrollToBottom();
    }

    // ─── Event Handlers ─────────────────────────────────────────────

    handleInputChange(event) {
        this.inputText = event.target.value;
    }

    handleKeyUp(event) {
        if (event.key === 'Enter') {
            this.handleSend();
        }
    }

    handleQuickAction(event) {
        const message = event.currentTarget.dataset.message;
        this.inputText = message;
        this.handleSend();
    }

    dismissError() {
        this.error = null;
    }

    scrollToBottom() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const thread = this.template.querySelector('.message-thread');
            if (thread) {
                thread.scrollTop = thread.scrollHeight;
            }
        }, 50);
    }
}
