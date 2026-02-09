import { LightningElement, api } from 'lwc';

export default class PortfolioCard extends LightningElement {
    @api portfolio;
    @api metrics;

    get displayMetrics() {
        return this.metrics || {
            totalCustomers: 0,
            activeCustomers: 0,
            agentActionsToday: 0,
            humanInterventionsToday: 0,
            pendingActions: 0
        };
    }

    get automationPercentage() {
        const total = this.displayMetrics.agentActionsToday + this.displayMetrics.humanInterventionsToday;
        if (total === 0) return 0;
        return Math.round((this.displayMetrics.agentActionsToday / total) * 100);
    }

    get agentBarStyle() {
        return `width: ${this.automationPercentage}%`;
    }

    get humanBarStyle() {
        return `width: ${100 - this.automationPercentage}%`;
    }

    get autonomyBadgeClass() {
        const level = this.portfolio?.autonomyLevel || 'Manual';
        const baseClass = 'slds-badge autonomy-badge';

        switch (level) {
            case 'Full Auto':
                return `${baseClass} autonomy-badge--full-auto`;
            case 'Supervised':
                return `${baseClass} autonomy-badge--supervised`;
            case 'Assisted':
                return `${baseClass} autonomy-badge--assisted`;
            default:
                return `${baseClass} autonomy-badge--manual`;
        }
    }

    get autonomyIcon() {
        const level = this.portfolio?.autonomyLevel || 'Manual';

        switch (level) {
            case 'Full Auto':
                return 'utility:check';
            case 'Supervised':
                return 'utility:preview';
            case 'Assisted':
                return 'utility:edit';
            default:
                return 'utility:user';
        }
    }
}
