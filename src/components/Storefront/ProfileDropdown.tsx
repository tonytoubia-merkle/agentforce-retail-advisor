import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '@/contexts/CustomerContext';
import { PERSONA_STUBS } from '@/mocks/customerPersonas';
import type { PersonaStub } from '@/mocks/customerPersonas';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { customer, selectedPersonaId, selectPersona, isResolving, isLoading } = useCustomer();

  const activeStub = PERSONA_STUBS.find((s) => s.id === selectedPersonaId);
  const isKnown = customer?.merkuryIdentity?.identityTier === 'known';
  const firstName = customer?.name?.split(' ')[0] || 'Guest';

  const handleSelect = async (personaId: string) => {
    await selectPersona(personaId);
  };

  const handleLogout = () => {
    selectPersona('anonymous');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 text-stone-600 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
        aria-label="Account"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          isKnown
            ? 'bg-gradient-to-br from-rose-400 to-purple-500'
            : 'bg-stone-400'
        }`}>
          {isKnown ? firstName.charAt(0).toUpperCase() : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              {/* Greeting section */}
              <div className="px-4 py-4 bg-gradient-to-br from-stone-50 to-rose-50 border-b border-gray-100">
                {isKnown ? (
                  <>
                    <p className="text-lg font-medium text-stone-900">
                      Hello, {firstName}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {customer?.loyalty?.tier && (
                        <span className="capitalize">{customer.loyalty.tier} Member</span>
                      )}
                      {customer?.loyalty?.pointsBalance && (
                        <span> · {customer.loyalty.pointsBalance.toLocaleString()} pts</span>
                      )}
                      {!customer?.loyalty && 'Welcome back'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-stone-900">Welcome</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      Sign in to access your profile
                    </p>
                  </>
                )}
              </div>

              {/* Quick links - only for known customers */}
              {isKnown && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order History
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Saved Items
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Beauty Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Demo persona switcher section */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Demo Profiles
                  </span>
                  <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    Testing
                  </span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {PERSONA_STUBS.map((stub) => {
                    const isActive = stub.id === activeStub?.id;
                    const stubFirstName = stub.defaultLabel.split(' ')[0];
                    return (
                      <button
                        key={stub.id}
                        onClick={() => handleSelect(stub.id)}
                        disabled={isResolving || isLoading}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-rose-50 border border-rose-200'
                            : 'hover:bg-stone-50 border border-transparent'
                        } ${(isResolving || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
                          stub.identityTier === 'anonymous'
                            ? 'bg-stone-400'
                            : stub.identityTier === 'appended'
                              ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                              : 'bg-gradient-to-br from-rose-400 to-purple-500'
                        }`}>
                          {stub.identityTier === 'anonymous' ? '?' : stubFirstName.charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium text-stone-900 truncate">
                            {stub.defaultLabel}
                          </div>
                          <div className="text-xs text-stone-500 truncate">
                            {stub.identityTier === 'anonymous'
                              ? 'New visitor'
                              : stub.identityTier === 'appended'
                                ? '3rd party data only'
                                : 'Known customer'}
                          </div>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout */}
              {isKnown && (
                <div className="px-4 py-3 border-t border-gray-100 bg-stone-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <span>Not {firstName}? Log out</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
