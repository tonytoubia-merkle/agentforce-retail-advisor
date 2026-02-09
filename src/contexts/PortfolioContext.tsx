/**
 * Portfolio Context
 *
 * State management for the portfolio management system.
 * Handles owner authentication, portfolio selection, and actions.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  PortfolioOwner,
  Portfolio,
  PortfolioCustomer,
  AgentActivity,
} from '@/types/portfolio';
import {
  PORTFOLIO_OWNERS,
  PORTFOLIOS,
  PENDING_CUSTOMERS,
  AGENT_ACTIVITY,
  getPortfoliosForOwner,
  getPendingCustomersForPortfolio,
  getAgentActivityForPortfolio,
} from '@/mocks/portfolioData';

// ─── Context Types ──────────────────────────────────────────────

interface PortfolioContextValue {
  // Current user
  currentOwner: PortfolioOwner | null;
  isAdmin: boolean;
  allOwners: PortfolioOwner[];

  // Portfolios
  availablePortfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;

  // Data for selected portfolio
  pendingCustomers: PortfolioCustomer[];
  recentActivity: AgentActivity[];

  // Actions
  selectOwner: (ownerId: string) => void;
  selectPortfolio: (portfolioId: string) => void;
  approveAction: (customerId: string, actionId: string) => void;
  rejectAction: (customerId: string, actionId: string) => void;
  takeOver: (customerId: string) => void;

  // Computed
  totalPendingActions: number;
  criticalActionsCount: number;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  // State
  const [currentOwnerId, setCurrentOwnerId] = useState<string>('owner-admin');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  // Derived state
  const currentOwner = useMemo(() => {
    return PORTFOLIO_OWNERS.find(o => o.id === currentOwnerId) || null;
  }, [currentOwnerId]);

  const isAdmin = useMemo(() => {
    return currentOwner?.permissions.canViewAllPortfolios ?? false;
  }, [currentOwner]);

  const availablePortfolios = useMemo(() => {
    if (!currentOwner) return [];
    return getPortfoliosForOwner(currentOwner.id);
  }, [currentOwner]);

  const selectedPortfolio = useMemo(() => {
    if (!selectedPortfolioId) return availablePortfolios[0] || null;
    return availablePortfolios.find(p => p.id === selectedPortfolioId) || availablePortfolios[0] || null;
  }, [selectedPortfolioId, availablePortfolios]);

  const pendingCustomers = useMemo(() => {
    if (!selectedPortfolio) return [];
    return getPendingCustomersForPortfolio(selectedPortfolio.id);
  }, [selectedPortfolio]);

  const recentActivity = useMemo(() => {
    if (!selectedPortfolio) return [];
    return getAgentActivityForPortfolio(selectedPortfolio.id);
  }, [selectedPortfolio]);

  // Computed metrics
  const totalPendingActions = useMemo(() => {
    return availablePortfolios.reduce((sum, p) => sum + p.metrics.pendingActions, 0);
  }, [availablePortfolios]);

  const criticalActionsCount = useMemo(() => {
    return PENDING_CUSTOMERS.filter(c =>
      c.pendingAction?.urgency === 'critical'
    ).length;
  }, []);

  // Actions
  const selectOwner = useCallback((ownerId: string) => {
    setCurrentOwnerId(ownerId);
    setSelectedPortfolioId(null); // Reset portfolio selection
  }, []);

  const selectPortfolio = useCallback((portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  }, []);

  const approveAction = useCallback((customerId: string, actionId: string) => {
    // In a real app, this would call an API
    console.log(`Approved action ${actionId} for customer ${customerId}`);
    // TODO: Update local state or trigger refetch
  }, []);

  const rejectAction = useCallback((customerId: string, actionId: string) => {
    console.log(`Rejected action ${actionId} for customer ${customerId}`);
  }, []);

  const takeOver = useCallback((customerId: string) => {
    console.log(`Taking over customer ${customerId}`);
  }, []);

  // Context value
  const value: PortfolioContextValue = {
    currentOwner,
    isAdmin,
    allOwners: PORTFOLIO_OWNERS,
    availablePortfolios,
    selectedPortfolio,
    pendingCustomers,
    recentActivity,
    selectOwner,
    selectPortfolio,
    approveAction,
    rejectAction,
    takeOver,
    totalPendingActions,
    criticalActionsCount,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
