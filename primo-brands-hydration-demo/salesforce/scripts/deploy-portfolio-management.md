# Portfolio Management Deployment Guide

This guide walks through deploying the Portfolio Management system to your Salesforce org.

## Prerequisites

1. **Salesforce CLI (sf)** installed and authenticated to your org
2. **Data Cloud** enabled in the org (for engagement features)
3. **Admin access** to create custom fields, objects, and permission sets

## Deployment Steps

### 1. Deploy Metadata

From the project root directory:

```bash
cd salesforce

# Deploy all metadata
sf project deploy start --source-dir force-app/main/default

# Or deploy specific components:
sf project deploy start --source-dir force-app/main/default/objects
sf project deploy start --source-dir force-app/main/default/classes
sf project deploy start --source-dir force-app/main/default/lwc
sf project deploy start --source-dir force-app/main/default/permissionsets
sf project deploy start --source-dir force-app/main/default/tabs
sf project deploy start --source-dir force-app/main/default/applications
```

### 2. Assign Permission Sets

```bash
# For admins
sf org assign permset --name Portfolio_Admin --target-org <your-org-alias>

# For portfolio owners
sf org assign permset --name Portfolio_Owner --target-org <your-org-alias>
```

### 3. Create Sample Portfolios (Campaigns)

Run this in Developer Console → Anonymous Apex:

```apex
// Create sample portfolios
List<Campaign> portfolios = new List<Campaign>();

portfolios.add(new Campaign(
    Name = 'VIP Relationships',
    Is_Portfolio__c = true,
    Portfolio_Type__c = 'VIP Relationships',
    Agent_Autonomy__c = 'Supervised',
    Status = 'In Progress',
    IsActive = true
));

portfolios.add(new Campaign(
    Name = 'Retention & Winback',
    Is_Portfolio__c = true,
    Portfolio_Type__c = 'Retention & Winback',
    Agent_Autonomy__c = 'Full Auto',
    Status = 'In Progress',
    IsActive = true
));

portfolios.add(new Campaign(
    Name = 'New Customer Nurture',
    Is_Portfolio__c = true,
    Portfolio_Type__c = 'New Customer Nurture',
    Agent_Autonomy__c = 'Assisted',
    Status = 'In Progress',
    IsActive = true
));

portfolios.add(new Campaign(
    Name = 'Service Recovery',
    Is_Portfolio__c = true,
    Portfolio_Type__c = 'Service Recovery',
    Agent_Autonomy__c = 'Manual',
    Status = 'In Progress',
    IsActive = true
));

portfolios.add(new Campaign(
    Name = 'Meaningful Events',
    Is_Portfolio__c = true,
    Portfolio_Type__c = 'Meaningful Events',
    Agent_Autonomy__c = 'Supervised',
    Status = 'In Progress',
    IsActive = true
));

insert portfolios;

// Assign current user as Portfolio Owner
User currentUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
for (Campaign c : portfolios) {
    c.Portfolio_Owner__c = currentUser.Id;
}
update portfolios;

System.debug('Created ' + portfolios.size() + ' portfolios');
```

### 4. Add Sample Members to Portfolios

```apex
// Get portfolios and contacts
List<Campaign> portfolios = [SELECT Id, Name FROM Campaign WHERE Is_Portfolio__c = true];
List<Contact> contacts = [SELECT Id, Name FROM Contact LIMIT 20];

if (portfolios.isEmpty() || contacts.isEmpty()) {
    System.debug('No portfolios or contacts found');
    return;
}

List<CampaignMember> members = new List<CampaignMember>();

// Distribute contacts across portfolios
Integer portfolioIndex = 0;
for (Contact c : contacts) {
    Campaign portfolio = portfolios[Math.mod(portfolioIndex, portfolios.size())];

    CampaignMember cm = new CampaignMember(
        CampaignId = portfolio.Id,
        ContactId = c.Id,
        Status = 'Sent',
        Priority__c = Math.mod(portfolioIndex, 4) == 0 ? 'Critical' :
                      Math.mod(portfolioIndex, 4) == 1 ? 'High' :
                      Math.mod(portfolioIndex, 4) == 2 ? 'Medium' : 'Low',
        Lifetime_Value__c = Math.random() * 5000 + 500
    );

    // Add pending action to some members
    if (Math.mod(portfolioIndex, 3) == 0) {
        cm.Pending_Action_Type__c = 'Approve Draft';
        cm.Agent_Suggestion__c = 'Send personalized offer: 20% off their favorite category based on browse history.';
        cm.Action_Due_Date__c = DateTime.now().addDays(1);
    } else if (Math.mod(portfolioIndex, 5) == 0) {
        cm.Pending_Action_Type__c = 'Take Over';
        cm.Agent_Suggestion__c = 'Customer expressed frustration in recent chat. Human touch recommended.';
    }

    members.add(cm);
    portfolioIndex++;
}

insert members;
System.debug('Created ' + members.size() + ' campaign members');
```

### 5. Create Sample Agent Activities

```apex
List<Campaign> portfolios = [SELECT Id FROM Campaign WHERE Is_Portfolio__c = true LIMIT 1];
List<Contact> contacts = [SELECT Id FROM Contact LIMIT 10];

if (portfolios.isEmpty() || contacts.isEmpty()) {
    System.debug('No data found');
    return;
}

List<Agent_Activity__c> activities = new List<Agent_Activity__c>();
String[] actions = new String[]{
    'Sent personalized product recommendation',
    'Triggered cart abandonment reminder',
    'Sent loyalty points reminder',
    'Initiated winback sequence',
    'Sent birthday offer'
};
String[] channels = new String[]{'Email', 'SMS', 'Push Notification', 'In-App'};
String[] statuses = new String[]{'Sent', 'Sent', 'Sent', 'Pending Approval', 'Paused'};

for (Integer i = 0; i < 15; i++) {
    activities.add(new Agent_Activity__c(
        Campaign__c = portfolios[0].Id,
        Contact__c = contacts[Math.mod(i, contacts.size())].Id,
        Channel__c = channels[Math.mod(i, channels.size())],
        Action__c = actions[Math.mod(i, actions.size())],
        Status__c = statuses[Math.mod(i, statuses.size())],
        Details__c = 'Automated action based on customer behavior signals.',
        Activity_Date__c = DateTime.now().addHours(-i)
    ));
}

insert activities;
System.debug('Created ' + activities.size() + ' agent activities');
```

### 6. Access the Portfolio Management App

1. Click the App Launcher (9-dot grid icon)
2. Search for "Portfolio Management"
3. Click to open the app
4. The Portfolio Management tab should be the default

## Architecture Overview

### Data Model

| Object | Purpose |
|--------|---------|
| Campaign (with custom fields) | Portfolios - groups of customers |
| CampaignMember (with custom fields) | Customer assignments with priority and pending actions |
| Case (with custom fields) | Escalations requiring human intervention |
| Agent_Activity__c | Tracks all agent actions |

### Custom Fields

**Campaign:**
- `Is_Portfolio__c` - Identifies as portfolio
- `Portfolio_Type__c` - VIP, Retention, New Customer, etc.
- `Agent_Autonomy__c` - Full Auto, Supervised, Assisted, Manual
- `Portfolio_Owner__c` - Assigned marketing user
- `Escalation_Config__c` - JSON config for triggers

**CampaignMember:**
- `Priority__c` - Critical, High, Medium, Low
- `Pending_Action_Type__c` - Approve Draft, Take Over, Decision Needed, Review
- `Agent_Suggestion__c` - AI recommendation
- `Action_Due_Date__c` - Deadline
- `Last_Agent_Action__c` - Last automation
- `Lifetime_Value__c` - Customer LTV

**Case:**
- `Portfolio_Campaign__c` - Link to portfolio
- `Escalation_Trigger__c` - What caused escalation
- `Agent_Suggestion__c` - AI recommendation

### Permission Sets

- **Portfolio_Admin**: Full access to all portfolios, can configure
- **Portfolio_Owner**: Access to assigned portfolios only

### LWC Components

- `portfolioManagement` - Main dashboard
- `portfolioCard` - Portfolio metrics display
- `pendingEscalations` - Action cards for customers needing attention
- `customerEngagement` - Data Cloud engagement display

## Data Cloud Integration

The `DataCloudEngagementController` Apex class is designed to query Data Cloud for:
- Last visit timestamp
- Browse history
- Cart abandonment status
- Email engagement metrics

**Note:** The Data Cloud queries use placeholder DMO names. Update these to match your actual Data Cloud schema:
- `ssot__WebEngagement__dlm` → Your web engagement DMO
- `ssot__EmailEngagement__dlm` → Your email engagement DMO

## Troubleshooting

**"No portfolios found"**
- Ensure Campaigns have `Is_Portfolio__c = true`
- Check `Portfolio_Owner__c` is set to current user (or user is admin)

**Permission errors**
- Assign `Portfolio_Admin` or `Portfolio_Owner` permission set
- Check Campaign and CampaignMember object permissions

**Data Cloud errors**
- Data Cloud may not be configured - the UI will still work without it
- Update DMO names in `DataCloudEngagementController` to match your schema
