/**
 * Pending Actions Panel
 *
 * Displays customers requiring human attention with actionable cards.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { PortfolioCustomer, ActionUrgency } from '@/types/portfolio';

const urgencyStyles: Record<ActionUrgency, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-stone-50', text: 'text-stone-600', dot: 'bg-stone-400' },
};

const actionTypeLabels: Record<string, string> = {
  'approve-draft': 'Review Draft',
  'take-over': 'Take Over',
  'decide': 'Decision Needed',
  'review': 'Review',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function CustomerActionCard({ customer }: { customer: PortfolioCustomer }) {
  const { approveAction, rejectAction, takeOver } = usePortfolio();

  if (!customer.pendingAction) return null;

  const action = customer.pendingAction;
  const urgency = urgencyStyles[action.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border ${
        action.urgency === 'critical'
          ? 'border-red-200 bg-red-50/50'
          : 'border-stone-200 bg-white'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-stone-600 font-medium">
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-stone-900">{customer.name}</h4>
                {customer.loyaltyTier && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                    {customer.loyaltyTier}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500">
                LTV: ${customer.lifetimeValue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${urgency.bg}`}>
            <span className={`w-2 h-2 rounded-full ${urgency.dot} ${action.urgency === 'critical' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-medium ${urgency.text} capitalize`}>
              {action.urgency}
            </span>
          </div>
        </div>
      </div>

      {/* Event Info */}
      {customer.currentEvent && (
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
          <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">
            Current Event
          </div>
          <p className="text-sm text-stone-700">{customer.currentEvent.description}</p>
          <p className="text-xs text-stone-400 mt-1">
            {formatTimeAgo(customer.currentEvent.occurredAt)}
          </p>
        </div>
      )}

      {/* Action Required */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Action Required
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
            {actionTypeLabels[action.type] || action.type}
          </span>
        </div>
        <p className="text-sm text-stone-700 mb-3">{action.description}</p>

        {/* Agent Suggestion */}
        {action.agentSuggestion && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
              <span className="text-xs font-medium text-purple-700">Agent Suggestion</span>
            </div>
            <p className="text-sm text-purple-800">{action.agentSuggestion}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {action.type === 'approve-draft' && (
            <>
              <button
                onClick={() => approveAction(customer.id, action.id)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Approve & Send
              </button>
              <button
                onClick={() => rejectAction(customer.id, action.id)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
              >
                Edit
              </button>
            </>
          )}
          {action.type === 'take-over' && (
            <button
              onClick={() => takeOver(customer.id)}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Take Over Conversation
            </button>
          )}
          {action.type === 'decide' && (
            <>
              <button
                onClick={() => approveAction(customer.id, action.id)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Follow Suggestion
              </button>
              <button
                onClick={() => rejectAction(customer.id, action.id)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
              >
                Other Action
              </button>
            </>
          )}
          {action.type === 'review' && (
            <button
              onClick={() => approveAction(customer.id, action.id)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Review & Approve
            </button>
          )}
        </div>
      </div>

      {/* Due Date */}
      {action.dueAt && (
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-xs text-stone-500">
          Due: {action.dueAt.toLocaleString()}
        </div>
      )}
    </motion.div>
  );
}

export function PendingActionsPanel() {
  const { pendingCustomers, selectedPortfolio } = usePortfolio();

  if (!selectedPortfolio) return null;

  const sortedCustomers = [...pendingCustomers].sort((a, b) => {
    const urgencyOrder: Record<ActionUrgency, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    const aUrgency = a.pendingAction?.urgency || 'low';
    const bUrgency = b.pendingAction?.urgency || 'low';
    return urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">Needs Your Attention</h3>
          <span className="text-sm text-stone-500">
            {pendingCustomers.length} customers
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {sortedCustomers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-stone-600 font-medium">All caught up!</p>
            <p className="text-sm text-stone-500">No pending actions for this portfolio.</p>
          </div>
        ) : (
          sortedCustomers.map((customer) => (
            <CustomerActionCard key={customer.id} customer={customer} />
          ))
        )}
      </div>
    </div>
  );
}
