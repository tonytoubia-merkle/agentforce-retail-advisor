/**
 * Owner Selector
 *
 * Dropdown to switch between portfolio owners (for demo purposes).
 * In production, this would be tied to actual authentication.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function OwnerSelector() {
  const { currentOwner, allOwners, selectOwner } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOwner) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'owner': return 'bg-blue-100 text-blue-700';
      case 'collaborator': return 'bg-green-100 text-green-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
          {currentOwner.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-stone-900">{currentOwner.name}</div>
          <div className="text-xs text-stone-500">{currentOwner.role}</div>
        </div>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden z-50"
          >
            <div className="p-2 border-b border-stone-100">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider px-2">
                Switch User (Demo)
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {allOwners.map((owner) => (
                <button
                  key={owner.id}
                  onClick={() => {
                    selectOwner(owner.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors ${
                    owner.id === currentOwner.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {owner.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 truncate">{owner.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(owner.role)}`}>
                        {owner.role}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 truncate">{owner.title}</div>
                  </div>
                  {owner.id === currentOwner.id && (
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
