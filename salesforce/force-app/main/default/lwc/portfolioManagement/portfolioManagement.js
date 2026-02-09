import { LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPortfolios from '@salesforce/apex/PortfolioController.getPortfolios';
import getPortfolioMetrics from '@salesforce/apex/PortfolioController.getPortfolioMetrics';
import getRecentActivity from '@salesforce/apex/PortfolioController.getRecentActivity';
import updateAutonomyLevel from '@salesforce/apex/PortfolioController.updateAutonomyLevel';

export default class PortfolioManagement extends LightningElement {
    @track portfolios = [];
    @track selectedPortfolio = null;
    @track portfolioMetrics = null;
    @track recentActivity = [];
    @track isLoading = true;

    wiredPortfoliosResult;
    wiredMetricsResult;
    wiredActivityResult;

    autonomyOptions = [
        { label: 'Full Auto', value: 'Full Auto' },
        { label: 'Supervised', value: 'Supervised' },
        { label: 'Assisted', value: 'Assisted' },
        { label: 'Manual', value: 'Manual' }
    ];

    @wire(getPortfolios)
    wiredPortfolios(result) {
        console.log('=== Portfolio Wire Result ===');
        console.log('Full result:', JSON.stringify(result));
        console.log('Data:', result.data);
        console.log('Error:', result.error);

        this.wiredPortfoliosResult = result;
        this.isLoading = false;

        if (result.data) {
            console.log('Portfolio count:', result.data.length);
            this.portfolios = result.data.map(p => {
                console.log('Processing portfolio:', p.name, p.id);
                return {
                    ...p,
                    itemClass: this.selectedPortfolio?.id === p.id
                        ? 'slds-item slds-is-active portfolio-item portfolio-item--selected'
                        : 'slds-item portfolio-item'
                };
            });

            // Auto-select first portfolio if none selected
            if (!this.selectedPortfolio && this.portfolios.length > 0) {
                console.log('Auto-selecting first portfolio');
                this.selectPortfolio(this.portfolios[0].id);
            }
        } else if (result.error) {
            console.error('Wire error details:', JSON.stringify(result.error));
            this.showToast('Error', 'Failed to load portfolios', 'error');
            console.error('Error loading portfolios:', result.error);
        } else {
            console.log('No data and no error - wire still pending?');
        }
    }

    handlePortfolioSelect(event) {
        const portfolioId = event.currentTarget.dataset.id;
        this.selectPortfolio(portfolioId);
    }

    selectPortfolio(portfolioId) {
        const portfolio = this.portfolios.find(p => p.id === portfolioId);
        if (portfolio) {
            this.selectedPortfolio = portfolio;

            // Update selection styling
            this.portfolios = this.portfolios.map(p => ({
                ...p,
                itemClass: p.id === portfolioId
                    ? 'slds-item slds-is-active portfolio-item portfolio-item--selected'
                    : 'slds-item portfolio-item'
            }));

            // Load metrics and activity
            this.loadPortfolioData(portfolioId);
        }
    }

    loadPortfolioData(portfolioId) {
        // Load metrics
        getPortfolioMetrics({ portfolioId })
            .then(result => {
                this.portfolioMetrics = result;
            })
            .catch(error => {
                console.error('Error loading metrics:', error);
            });

        // Load recent activity
        getRecentActivity({ portfolioId, limitCount: 20 })
            .then(result => {
                this.recentActivity = result.map(activity => ({
                    ...activity,
                    iconName: this.getActivityIcon(activity.Status__c),
                    iconVariant: this.getActivityIconVariant(activity.Status__c),
                    formattedDate: this.formatDate(activity.Activity_Date__c)
                }));
            })
            .catch(error => {
                console.error('Error loading activity:', error);
            });
    }

    getActivityIcon(status) {
        const icons = {
            'Sent': 'utility:success',
            'Pending Approval': 'utility:clock',
            'Paused': 'utility:pause',
            'Failed': 'utility:error',
            'Approved': 'utility:check',
            'Rejected': 'utility:close'
        };
        return icons[status] || 'utility:activity';
    }

    getActivityIconVariant(status) {
        if (status === 'Sent' || status === 'Approved') return 'success';
        if (status === 'Failed' || status === 'Rejected') return 'error';
        if (status === 'Pending Approval') return 'warning';
        return '';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    }

    handleAutonomyChange(event) {
        const newLevel = event.detail.value;

        updateAutonomyLevel({
            portfolioId: this.selectedPortfolio.id,
            autonomyLevel: newLevel
        })
        .then(() => {
            this.selectedPortfolio = { ...this.selectedPortfolio, autonomyLevel: newLevel };
            this.showToast('Success', `Autonomy level updated to ${newLevel}`, 'success');
        })
        .catch(error => {
            this.showToast('Error', 'Failed to update autonomy level', 'error');
            console.error('Error updating autonomy:', error);
        });
    }

    handleRefresh() {
        this.isLoading = true;
        refreshApex(this.wiredPortfoliosResult)
            .then(() => {
                if (this.selectedPortfolio) {
                    this.loadPortfolioData(this.selectedPortfolio.id);
                }
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleActionComplete() {
        // Refresh data after an action is completed
        this.handleRefresh();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}
