import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryWallPersona } from '@/mocks/historyWallPersonas';
import { ARCHETYPE_CONFIG } from '@/mocks/historyWallPersonas';
import type { SeedResult } from '@/services/salesforce/seedPersona';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(daysAgo: number): string {
  if (daysAgo <= 0) return 'Never';
  if (daysAgo === 1) return '1 day ago';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return '1 week ago';
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 60) return '1 month ago';
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
  const years = daysAgo / 365;
  return years < 1.5 ? '1 year ago' : `${years.toFixed(0)} years ago`;
}

function loyaltyColor(tier?: string, expired?: boolean): string {
  if (expired || !tier) return 'text-stone-500';
  if (tier === 'platinum') return 'text-cyan-300';
  if (tier === 'gold') return 'text-amber-300';
  if (tier === 'silver') return 'text-slate-300';
  return 'text-amber-700';
}

function loyaltyLabel(tier?: string, expired?: boolean): string {
  if (expired) return 'Expired';
  if (!tier) return 'None';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function identityBadge(tier: 'known' | 'appended' | 'anonymous'): { label: string; classes: string } {
  if (tier === 'known') return { label: 'Known', classes: 'bg-emerald-500/15 text-emerald-400' };
  if (tier === 'appended') return { label: '3P Appended', classes: 'bg-indigo-500/15 text-indigo-400' };
  return { label: 'Anonymous', classes: 'bg-neutral-500/15 text-neutral-500' };
}

// ─── Seeding state ────────────────────────────────────────────────────────────

type SeedState = 'idle' | 'seeding' | 'success' | 'error';

// ─── Claim Modal ──────────────────────────────────────────────────────────────

interface ClaimModalProps {
  persona: HistoryWallPersona;
  onSeed: (persona: HistoryWallPersona) => Promise<SeedResult>;
  onDone: () => void;
  onCancel: () => void;
}

function ClaimModal({ persona, onSeed, onDone, onCancel }: ClaimModalProps) {
  const [seedState, setSeedState] = useState<SeedState>('idle');
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const cfg = ARCHETYPE_CONFIG[persona.archetype];
  const { seedData } = persona;

  async function handleConfirm() {
    setSeedState('seeding');
    try {
      const result = await onSeed(persona);
      setSeedResult(result);
      setSeedState('success');
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Unknown error');
      setSeedState('error');
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={seedState === 'idle' ? onCancel : undefined} />

      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-stone-900 border border-white/10 rounded-2xl shadow-2xl"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-stone-900 border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                  {cfg.label}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">{persona.displayName}</h2>
              <p className="text-sm text-white/50 mt-0.5">
                {persona.age > 0 ? `Age ${persona.age} · ` : ''}{persona.city}{persona.state ? `, ${persona.state}` : ''}
              </p>
            </div>
            {seedState === 'idle' && (
              <button onClick={onCancel} className="text-white/40 hover:text-white/70 transition-colors mt-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-white/40 mt-3 italic">"{cfg.tagline}"</p>
        </div>

        {/* ── Seeding state ── */}
        <AnimatePresence mode="wait">

          {/* Seeding in progress */}
          {seedState === 'seeding' && (
            <motion.div
              key="seeding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-16 flex flex-col items-center gap-6"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-t-violet-400 animate-spin" />
                <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">{persona.avatarInitials}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Seeding to Salesforce…</p>
                <p className="text-sm text-white/40 mt-1">Writing engagement history to CRM + Data Cloud</p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                {[
                  { label: 'Contact', done: true },
                  { label: `${seedData.chatSummaries.length} chat summaries`, done: true },
                  { label: `${seedData.meaningfulEvents.length} meaningful events`, done: true },
                  { label: `${seedData.browseSessions.length} browse sessions`, done: true },
                  { label: `${seedData.orders.length} orders`, done: seedData.orders.length > 0 },
                ].map(({ label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    </div>
                    <span className="text-xs text-white/50">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success */}
          {seedState === 'success' && seedResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Seeded to Salesforce</p>
                  <p className="text-sm text-white/50">
                    Contact {seedResult.recordsCreated.contact === 'created' ? 'created' : 'found'} · {seedResult.contactId.slice(0, 15)}…
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Chat Summaries', value: seedResult.recordsCreated.chatSummaries, icon: '💬', obj: 'Chat_Summary__c' },
                  { label: 'Life Events', value: seedResult.recordsCreated.meaningfulEvents, icon: '📌', obj: 'Meaningful_Event__c' },
                  { label: 'Browse Sessions', value: seedResult.recordsCreated.browseSessions, icon: '👁', obj: 'Browse_Session__c' },
                  { label: 'Profile Fields', value: seedResult.recordsCreated.agentProfileFields, icon: '🧠', obj: 'Agent_Captured_Profile__c' },
                  { label: 'Orders', value: seedResult.recordsCreated.orders, icon: '🛍', obj: 'Order' },
                ].map(({ label, value, icon, obj }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-xl font-bold text-white">{value}</div>
                    <div className="text-[9px] text-white/30 mt-0.5">{label}</div>
                    <div className="text-[8px] text-white/15 mt-0.5 font-mono">{obj}</div>
                  </div>
                ))}
              </div>

              {seedResult.recordsCreated.errors.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
                  <p className="text-[11px] text-yellow-400/80 font-medium mb-1">Partial success — some records skipped:</p>
                  {seedResult.recordsCreated.errors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-[10px] text-yellow-400/50">{e}</p>
                  ))}
                  {seedResult.recordsCreated.errors.length > 3 && (
                    <p className="text-[10px] text-yellow-400/30">+{seedResult.recordsCreated.errors.length - 3} more (see server log)</p>
                  )}
                </div>
              )}

              <div className="bg-white/5 rounded-xl px-5 py-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Optimization segment</p>
                <p className="text-sm text-white/70">{persona.optimizationStory.segment}</p>
                <div className="mt-3 space-y-1">
                  {persona.optimizationStory.recommendedJourneys.slice(0, 2).map((j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-emerald-400 text-[10px] mt-0.5">▸</span>
                      <span className="text-[11px] text-white/60">{j}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {seedState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-8 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Salesforce seeding failed</p>
                  <p className="text-sm text-white/50">Persona claimed locally — check server logs for details</p>
                </div>
              </div>
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
                <p className="text-[11px] text-red-400/80 font-mono break-all">{seedError}</p>
              </div>
              <p className="text-xs text-white/30">
                Common causes: missing CLIENT_ID/SECRET in .env.local, custom objects not deployed, or network issue.
              </p>
            </motion.div>
          )}

          {/* Idle — show persona detail */}
          {seedState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-5 space-y-6"
            >
              {/* Seed summary */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Engagement History — Will Be Seeded to Salesforce
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Orders', value: seedData.orders.length, icon: '🛍' },
                    { label: 'Browse Sessions', value: seedData.browseSessions.length, icon: '👁' },
                    { label: 'Chat Summaries', value: seedData.chatSummaries.length, icon: '💬' },
                    { label: 'Life Events', value: seedData.meaningfulEvents.length, icon: '📌' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-white/5 rounded-xl px-4 py-3 text-center">
                      <div className="text-lg mb-0.5">{icon}</div>
                      <div className="text-xl font-bold text-white">{value}</div>
                      <div className="text-[10px] text-white/40">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders */}
              {seedData.orders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Purchase History</h3>
                  <div className="space-y-2">
                    {seedData.orders.slice(0, 4).map((o) => (
                      <div key={o.orderId} className="flex items-start justify-between gap-3 bg-white/5 rounded-lg px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 truncate">
                            {o.lineItems.map((l) => l.productName).join(', ')}
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">{o.orderDate} · {o.channel}</p>
                        </div>
                        <span className="text-xs font-semibold text-white whitespace-nowrap">${o.totalAmount}</span>
                      </div>
                    ))}
                    {seedData.orders.length > 4 && (
                      <p className="text-[10px] text-white/30 text-center">+{seedData.orders.length - 4} more orders</p>
                    )}
                  </div>
                </div>
              )}

              {/* Life events */}
              {seedData.meaningfulEvents.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Meaningful Events</h3>
                  <div className="space-y-2">
                    {seedData.meaningfulEvents.map((e, i) => (
                      <div key={i} className="bg-rose-900/20 border border-rose-800/30 rounded-lg px-4 py-3">
                        <p className="text-xs text-rose-100/80">{e.description}</p>
                        {e.agentNote && (
                          <p className="text-[10px] text-rose-400/70 mt-1 italic">Agent note: {e.agentNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat summaries */}
              {seedData.chatSummaries.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Agent Conversation History</h3>
                  <div className="space-y-2">
                    {seedData.chatSummaries.map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-lg px-4 py-3">
                        <p className="text-xs text-white/70 leading-relaxed">{s.summary}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.topicsDiscussed.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimization story */}
              <div className="bg-white/5 rounded-xl px-5 py-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                  What the Optimization Engine Will Do
                </h3>
                <p className="text-[11px] font-medium text-white/60 mb-2">Segment: {persona.optimizationStory.segment}</p>
                <div className="space-y-1.5 mb-3">
                  {persona.optimizationStory.recommendedJourneys.map((j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 text-[10px]">▸</span>
                      <span className="text-[11px] text-white/70">{j}</span>
                    </div>
                  ))}
                </div>
                {persona.optimizationStory.suppressFrom.length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Suppress from:</p>
                    <p className="text-[11px] text-red-400/60">{persona.optimizationStory.suppressFrom.join(' · ')}</p>
                  </div>
                )}
                <p className="text-[10px] text-white/30 mt-3 border-t border-white/10 pt-3">
                  <span className="text-white/50 font-medium">Flighting: </span>
                  {persona.optimizationStory.flightingNote}
                </p>
              </div>

              {/* Appended profile */}
              {seedData.appendedProfile && (
                <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl px-5 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400/60 mb-2">3P Merkury Appended Data</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
                    {seedData.appendedProfile.ageRange && <span>Age {seedData.appendedProfile.ageRange}</span>}
                    {seedData.appendedProfile.householdIncome && <span>HHI {seedData.appendedProfile.householdIncome}</span>}
                    {seedData.appendedProfile.geoRegion && <span>{seedData.appendedProfile.geoRegion}</span>}
                  </div>
                  {seedData.appendedProfile.interests && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {seedData.appendedProfile.interests.map((i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300/70">{i}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="sticky bottom-0 bg-stone-900 border-t border-white/10 px-6 py-4 flex items-center justify-between gap-4">
          {seedState === 'idle' && (
            <>
              <p className="text-[11px] text-white/30">
                Writes Contact + custom objects + Orders to Salesforce via server-side OAuth
              </p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-full text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-full bg-white text-stone-900 text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Seed to Salesforce →
                </button>
              </div>
            </>
          )}
          {seedState === 'seeding' && (
            <p className="text-sm text-white/40 w-full text-center">Writing records… please wait</p>
          )}
          {(seedState === 'success' || seedState === 'error') && (
            <button
              onClick={onDone}
              className="ml-auto px-5 py-2 rounded-full bg-white text-stone-900 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PersonaCard ──────────────────────────────────────────────────────────────

interface PersonaCardProps {
  persona: HistoryWallPersona;
  claimCount: number;
  isClaimed: boolean;
  onSeed: (persona: HistoryWallPersona) => Promise<SeedResult>;
  onClaimComplete: (persona: HistoryWallPersona) => void;
}

export function PersonaCard({ persona, claimCount, isClaimed, onSeed, onClaimComplete }: PersonaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const cfg = ARCHETYPE_CONFIG[persona.archetype];
  const idBadge = identityBadge(persona.seedData.identityTier);

  function handleDone() {
    setShowModal(false);
    onClaimComplete(persona);
  }

  return (
    <>
      <motion.div
        layout
        className={`
          relative flex flex-col bg-stone-900 border border-white/8 rounded-2xl overflow-hidden
          transition-colors duration-200 cursor-pointer group
          ${isClaimed ? 'border-white/20 ring-1 ring-white/15' : cfg.cardBorder}
        `}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        onClick={() => setShowModal(true)}
      >
        <div className={`h-0.5 w-full bg-gradient-to-r ${persona.avatarGradient}`} />

        <div className="flex flex-col flex-1 p-5 gap-4">
          {/* Archetype badge + claim count */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
              {cfg.label}
            </span>
            {claimCount > 0 && (
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                {claimCount} {claimCount === 1 ? 'claim' : 'claims'}
              </span>
            )}
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm">{persona.avatarInitials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{persona.displayName}</p>
              <p className="text-white/40 text-[11px] leading-tight mt-0.5">
                {persona.age > 0 ? `Age ${persona.age} · ` : ''}{persona.city}{persona.state ? `, ${persona.state}` : ''}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg px-2 py-2 text-center">
              <p className="text-white font-semibold text-sm">{persona.orderCount}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Orders</p>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-2 text-center">
              <p className="text-white font-semibold text-sm">
                {persona.lifetimeValue > 0 ? `$${persona.lifetimeValue}` : '—'}
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">LTV</p>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-2 text-center">
              <p className={`font-semibold text-sm ${loyaltyColor(persona.loyaltyTier, persona.loyaltyExpired)}`}>
                {loyaltyLabel(persona.loyaltyTier, persona.loyaltyExpired)}
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Loyalty</p>
            </div>
          </div>

          {/* Last active */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Last active:</span>
            <span className={`text-[10px] font-medium ${
              persona.lastActiveDaysAgo > 365 ? 'text-red-400/70'
              : persona.lastActiveDaysAgo > 120 ? 'text-orange-400/70'
              : 'text-emerald-400/70'
            }`}>
              {persona.lastActiveDaysAgo > 900 ? 'Never' : relativeTime(persona.lastActiveDaysAgo)}
            </span>
          </div>

          {/* Interests */}
          {persona.keyInterests[0] !== 'unknown' && (
            <div className="flex flex-wrap gap-1.5">
              {persona.keyInterests.slice(0, 3).map((interest) => (
                <span key={interest} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Tagline */}
          <p className="text-[11px] text-white/35 italic leading-relaxed border-t border-white/8 pt-3">
            {cfg.tagline}
          </p>

          {/* Identity + channel */}
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded ${idBadge.classes}`}>
              {idBadge.label}
            </span>
            <span className="text-[9px] text-white/25">{persona.primaryChannel}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className={`
          border-t border-white/8 px-5 py-3 flex items-center justify-between
          transition-colors duration-200
          ${isClaimed ? 'bg-white/8' : 'group-hover:bg-white/5'}
        `}>
          {isClaimed ? (
            <div className="flex items-center gap-2 w-full justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-emerald-400">Seeded to Salesforce</span>
            </div>
          ) : (
            <>
              <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                View profile + seed →
              </span>
              <span className="text-[10px] text-white/20">
                {seedData.orders.length} orders · {seedData.meaningfulEvents.length} events
              </span>
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ClaimModal
            persona={persona}
            onSeed={onSeed}
            onDone={handleDone}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
