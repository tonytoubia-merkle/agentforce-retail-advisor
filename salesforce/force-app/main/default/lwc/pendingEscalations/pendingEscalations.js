import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getPendingMembers from '@salesforce/apex/PortfolioController.getPendingMembers';
import approveAction from '@salesforce/apex/PortfolioController.approveAction';
import rejectAction from '@salesforce/apex/PortfolioController.rejectAction';
import takeOverCustomer from '@salesforce/apex/PortfolioController.takeOverCustomer';

export default class PendingEscalations extends LightningElement {
    @api portfolioId;
    @track pendingMembers = [];
    @track isLoading = true;

    wiredMembersResult;

    @wire(getPendingMembers, { portfolioId: '$portfolioId' })
    wiredMembers(result) {
        this.wiredMembersResult = result;
        this.isLoading = false;

        if (result.data) {
            this.pendingMembers = result.data.map(member => this.enrichMember(member));
        } else if (result.error) {
            console.error('Error loading pending members:', result.error);
        }
    }

    enrichMember(member) {
        return {
            ...member,
            initials: this.getInitials(member.name),
            formattedLTV: member.lifetimeValue
                ? `$${member.lifetimeValue.toLocaleString()}`
                : 'N/A',
            formattedDueDate: member.actionDueDate
                ? new Date(member.actionDueDate).toLocaleString()
                : null,
            priorityBadgeClass: this.getPriorityBadgeClass(member.priority),
            showApproveReject: member.pendingActionType === 'Approve Draft',
            showTakeOver: member.pendingActionType === 'Take Over',
            showDecision: member.pendingActionType === 'Decision Needed',
            showReview: member.pendingActionType === 'Review'
        };
    }

    getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getPriorityBadgeClass(priority) {
        const baseClass = 'slds-badge';
        switch (priority) {
            case 'Critical':
                return `${baseClass} slds-theme_error`;
            case 'High':
                return `${baseClass} slds-theme_warning`;
            case 'Medium':
                return `${baseClass} slds-badge_lightest`;
            default:
                return `${baseClass} slds-badge_inverse`;
        }
    }

    get memberCount() {
        return this.pendingMembers.length;
    }

    async handleApprove(event) {
        const memberId = event.target.dataset.id;
        this.isLoading = true;

        try {
            await approveAction({ memberId });
            this.showToast('Success', 'Action approved', 'success');
            this.dispatchEvent(new CustomEvent('actioncomplete'));
            await refreshApex(this.wiredMembersResult);
        } catch (error) {
            this.showToast('Error', 'Failed to approve action', 'error');
            console.error('Approve error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleReject(event) {
        const memberId = event.target.dataset.id;
        this.isLoading = true;

        try {
            await rejectAction({ memberId, reason: 'User requested edit' });
            this.showToast('Info', 'Action rejected - ready for manual edit', 'info');
            this.dispatchEvent(new CustomEvent('actioncomplete'));
            await refreshApex(this.wiredMembersResult);
        } catch (error) {
            this.showToast('Error', 'Failed to reject action', 'error');
            console.error('Reject error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleTakeOver(event) {
        const memberId = event.target.dataset.id;
        this.isLoading = true;

        try {
            const caseId = await takeOverCustomer({ memberId });
            this.showToast('Success', 'Case created for human follow-up', 'success');
            this.dispatchEvent(new CustomEvent('actioncomplete'));
            await refreshApex(this.wiredMembersResult);

            // Navigate to the case
            // Note: You may want to use NavigationMixin for this
            window.open(`/lightning/r/Case/${caseId}/view`, '_blank');
        } catch (error) {
            this.showToast('Error', 'Failed to create case', 'error');
            console.error('Take over error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}
