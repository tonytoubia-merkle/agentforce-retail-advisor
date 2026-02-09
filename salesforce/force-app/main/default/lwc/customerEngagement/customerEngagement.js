import { LightningElement, api, track, wire } from 'lwc';
import getEngagementSummary from '@salesforce/apex/DataCloudEngagementController.getEngagementSummary';
import getCartStatus from '@salesforce/apex/DataCloudEngagementController.getCartStatus';
import getEmailEngagement from '@salesforce/apex/DataCloudEngagementController.getEmailEngagement';
import getBrowseHistory from '@salesforce/apex/DataCloudEngagementController.getBrowseHistory';

export default class CustomerEngagement extends LightningElement {
    @api contactId;

    @track engagement = {
        lastVisit: null,
        totalEvents30Days: 0,
        hasRecentActivity: false,
        engagementLevel: 'Low'
    };

    @track cartStatus = {
        lastUpdated: null,
        cartValue: 0,
        itemCount: 0,
        hasAbandonedCart: false
    };

    @track emailEngagement = {
        opens30Days: 0,
        clicks30Days: 0
    };

    @track browseHistory = [];
    @track isLoading = true;

    connectedCallback() {
        if (this.contactId) {
            this.loadEngagementData();
        }
    }

    @api
    refresh() {
        this.loadEngagementData();
    }

    async loadEngagementData() {
        this.isLoading = true;

        try {
            // Load all engagement data in parallel
            const [summary, cart, email, browse] = await Promise.all([
                getEngagementSummary({ contactId: this.contactId }),
                getCartStatus({ contactId: this.contactId }),
                getEmailEngagement({ contactId: this.contactId }),
                getBrowseHistory({ contactId: this.contactId, limitCount: 5 })
            ]);

            this.engagement = summary || this.engagement;
            this.cartStatus = cart || this.cartStatus;
            this.emailEngagement = email || this.emailEngagement;
            this.browseHistory = (browse || []).map(event => ({
                ...event,
                formattedTime: this.formatTimeAgo(event.timestamp)
            }));
        } catch (error) {
            console.error('Error loading engagement data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    get formattedLastVisit() {
        if (!this.engagement.lastVisit) return 'Never';
        return this.formatTimeAgo(this.engagement.lastVisit);
    }

    get formattedCartValue() {
        if (!this.cartStatus.cartValue) return '$0';
        return `$${this.cartStatus.cartValue.toLocaleString()}`;
    }

    get engagementLevelClass() {
        const baseClass = 'slds-badge';
        switch (this.engagement.engagementLevel) {
            case 'High':
                return `${baseClass} slds-theme_success`;
            case 'Medium':
                return `${baseClass} slds-badge_lightest`;
            default:
                return `${baseClass} slds-badge_inverse`;
        }
    }

    formatTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}
