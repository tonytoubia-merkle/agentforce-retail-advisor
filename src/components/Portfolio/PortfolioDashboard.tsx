/**
 * Portfolio Dashboard
 *
 * Main dashboard for portfolio owners to manage their assigned customers
 * and review agent activity. Admins can view all portfolios.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { OwnerSelector } from './OwnerSelector';
import { PortfolioCard } from './PortfolioCard';
import { PendingActionsPanel } from './PendingActionsPanel';
import { AgentActivityFeed } from './AgentActivityFeed';
import { PortfolioMetrics } from './PortfolioMetrics';

export function PortfolioDashboard() {
  const {
    currentOwner,
    isAdmin,
    availablePortfolios,
    selectedPortfolio,
    selectPortfolio,
    totalPendingActions,
    criticalActionsCount,
  } = usePortfolio();

  if (!currentOwner) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">
                Portfolio Management
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {isAdmin ? 'Admin View — All Portfolios' : `${currentOwner.title}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Pending Actions Badge */}
              {totalPendingActions > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-amber-700">
                    {totalPendingActions} pending
                  </span>
                  {criticalActionsCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                      {criticalActionsCount} critical
                    </span>
                  )}
                </div>
              )}

              {/* Owner Selector */}
              <OwnerSelector />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Owner Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-stone-200 p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
              {currentOwner.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-stone-900">{currentOwner.name}</h2>
              <p className="text-sm text-stone-500">{currentOwner.title} • {currentOwner.department}</p>
            </div>
            {!isAdmin && currentOwner.capacity.maxCustomers > 0 && (
              <div className="text-right">
                <div className="text-sm text-stone-500">Capacity</div>
                <div className="font-semibold text-stone-900">
                  {currentOwner.capacity.currentCustomers.toLocaleString()} / {currentOwner.capacity.maxCustomers.toLocaleString()}
                </div>
                <div className="w-32 h-1.5 bg-stone-200 rounded-full mt-1">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (currentOwner.capacity.currentCustomers / currentOwner.capacity.maxCustomers) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Portfolio Cards Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
            {isAdmin ? 'All Portfolios' : 'My Portfolios'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PortfolioCard
                  portfolio={portfolio}
                  isSelected={selectedPortfolio?.id === portfolio.id}
                  onClick={() => selectPortfolio(portfolio.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Selected Portfolio Details */}
        {selectedPortfolio && (
          <motion.div
            key={selectedPortfolio.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Metrics & Activity */}
            <div className="lg:col-span-1 space-y-6">
              <PortfolioMetrics portfolio={selectedPortfolio} />
              <AgentActivityFeed />
            </div>

            {/* Right Column - Pending Actions */}
            <div className="lg:col-span-2">
              <PendingActionsPanel />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
