/**
 * Portfolio Metrics
 *
 * Key performance indicators for the selected portfolio.
 */

import React from 'react';
import type { Portfolio } from '@/types/portfolio';

interface PortfolioMetricsProps {
  portfolio: Portfolio;
}

export function PortfolioMetrics({ portfolio }: PortfolioMetricsProps) {
  const { metrics, agentAutonomy } = portfolio;

  // Calculate agent vs human ratio
  const totalTouchpoints = metrics.agentHandledToday + metrics.humanInterventionsToday;
  const agentPercentage = totalTouchpoints > 0
    ? Math.round((metrics.agentHandledToday / totalTouchpoints) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900">{portfolio.name} Metrics</h3>
        <p className="text-sm text-stone-500">Today's performance</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Customers */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm text-stone-600">Active Customers</span>
            <span className="text-lg font-semibold text-stone-900">
              {metrics.activeCustomers.toLocaleString()}
              <span className="text-sm font-normal text-stone-400">
                /{metrics.totalCustomers.toLocaleString()}
              </span>
            </span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${(metrics.activeCustomers / metrics.totalCustomers) * 100}%` }}
            />
          </div>
        </div>

        {/* Agent vs Human Split */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm text-stone-600">Agent Automation</span>
            <span className="text-lg font-semibold text-stone-900">{agentPercentage}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${agentPercentage}%` }}
            />
            <div
              className="h-full bg-blue-500"
              style={{ width: `${100 - agentPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-500 mt-1">
            <span>Agent: {metrics.agentHandledToday}</span>
            <span>Human: {metrics.humanInterventionsToday}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-stone-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-stone-900">
              {Math.round(metrics.conversionRate * 100)}%
            </div>
            <div className="text-xs text-stone-500">Conversion Rate</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-stone-900">
              {metrics.avgResponseTime}
            </div>
            <div className="text-xs text-stone-500">Avg Response</div>
          </div>
        </div>

        {/* Autonomy Level */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Autonomy Level</span>
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${
              agentAutonomy === 'full-auto' ? 'bg-green-100 text-green-700' :
              agentAutonomy === 'supervised' ? 'bg-blue-100 text-blue-700' :
              agentAutonomy === 'assisted' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {agentAutonomy === 'full-auto' ? 'Full Auto' :
               agentAutonomy === 'supervised' ? 'Supervised' :
               agentAutonomy === 'assisted' ? 'Assisted' : 'Manual'}
            </span>
          </div>
        </div>

        {/* Escalation Triggers */}
        <div className="pt-2 border-t border-stone-100">
          <div className="text-sm text-stone-600 mb-2">Active Escalation Triggers</div>
          <div className="space-y-1">
            {portfolio.escalationTriggers.filter(t => t.enabled).slice(0, 3).map((trigger) => (
              <div key={trigger.id} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-stone-600">{trigger.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
