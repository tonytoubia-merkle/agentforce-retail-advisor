/**
 * Agent Activity Feed
 *
 * Shows recent agent actions within the selected portfolio.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { AgentActivity } from '@/types/portfolio';

const statusStyles: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
  sent: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  paused: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  'pending-approval': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
  failed: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
};

const channelIcons: Record<string, JSX.Element> = {
  email: (
    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  sms: (
    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  push: (
    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  'in-app': (
    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${diffHours}h ago`;
}

function ActivityItem({ activity }: { activity: AgentActivity }) {
  const status = statusStyles[activity.status] || statusStyles.sent;
  const channelIcon = channelIcons[activity.channel] || channelIcons.email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-3 border-b border-stone-100 last:border-0"
    >
      {/* Status Icon */}
      <div className={`w-8 h-8 rounded-full ${status.bg} ${status.text} flex items-center justify-center flex-shrink-0`}>
        {status.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-900 truncate">
            {activity.customerName}
          </span>
          {channelIcon}
        </div>
        <p className="text-sm text-stone-600">{activity.action}</p>
        {activity.details && (
          <p className="text-xs text-stone-400 mt-0.5">{activity.details}</p>
        )}
      </div>

      {/* Time */}
      <div className="text-xs text-stone-400 flex-shrink-0">
        {formatTimeAgo(activity.timestamp)}
      </div>
    </motion.div>
  );
}

export function AgentActivityFeed() {
  const { recentActivity, selectedPortfolio } = usePortfolio();

  if (!selectedPortfolio) return null;

  // Get activity counts by status
  const sentCount = recentActivity.filter(a => a.status === 'sent').length;
  const pendingCount = recentActivity.filter(a => a.status === 'pending-approval').length;
  const pausedCount = recentActivity.filter(a => a.status === 'paused').length;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900 mb-2">Agent Activity</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-stone-600">{sentCount} sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-stone-600">{pendingCount} pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-stone-600">{pausedCount} paused</span>
          </div>
        </div>
      </div>

      <div className="px-4 max-h-80 overflow-y-auto">
        {recentActivity.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-500">No recent activity</p>
          </div>
        ) : (
          recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}
