/**
 * Portfolio Card
 *
 * Displays a portfolio summary with key metrics and status.
 */

import React from 'react';
import type { Portfolio } from '@/types/portfolio';

interface PortfolioCardProps {
  portfolio: Portfolio;
  isSelected: boolean;
  onClick: () => void;
}

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'bg-purple-100',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: 'bg-pink-100',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'bg-orange-100',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'bg-green-100',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'bg-red-100',
  },
};

const iconMap: Record<string, JSX.Element> = {
  crown: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5.5-4 4 1 5.5L10 14.5 4.5 17l1-5.5-4-4L7 7l3-5z" />
    </svg>
  ),
  gift: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  refresh: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  'user-plus': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  'life-buoy': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

const autonomyLabels: Record<string, { label: string; color: string }> = {
  'full-auto': { label: 'Full Auto', color: 'text-green-600' },
  'supervised': { label: 'Supervised', color: 'text-blue-600' },
  'assisted': { label: 'Assisted', color: 'text-amber-600' },
  'manual': { label: 'Manual', color: 'text-red-600' },
};

export function PortfolioCard({ portfolio, isSelected, onClick }: PortfolioCardProps) {
  const colors = colorMap[portfolio.color] || colorMap.purple;
  const icon = iconMap[portfolio.icon] || iconMap.crown;
  const autonomy = autonomyLabels[portfolio.agentAutonomy] || autonomyLabels.supervised;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? `${colors.bg} ${colors.border} shadow-md`
          : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.icon} ${colors.text} flex items-center justify-center`}>
          {icon}
        </div>
        {portfolio.metrics.pendingActions > 0 && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {portfolio.metrics.pendingActions} pending
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h4 className="font-semibold text-stone-900 mb-1">{portfolio.name}</h4>
      <p className="text-sm text-stone-500 line-clamp-2 mb-3">{portfolio.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-stone-50 rounded-lg py-1.5">
          <div className="text-lg font-semibold text-stone-900">
            {portfolio.metrics.totalCustomers.toLocaleString()}
          </div>
          <div className="text-xs text-stone-500">Customers</div>
        </div>
        <div className="bg-stone-50 rounded-lg py-1.5">
          <div className="text-lg font-semibold text-stone-900">
            {portfolio.metrics.agentHandledToday}
          </div>
          <div className="text-xs text-stone-500">Agent Today</div>
        </div>
        <div className="bg-stone-50 rounded-lg py-1.5">
          <div className="text-lg font-semibold text-stone-900">
            {portfolio.metrics.humanInterventionsToday}
          </div>
          <div className="text-xs text-stone-500">Human</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${autonomy.color}`}>
          {autonomy.label}
        </span>
        <span className="text-stone-400">
          {Math.round(portfolio.metrics.conversionRate * 100)}% conversion
        </span>
      </div>
    </button>
  );
}
