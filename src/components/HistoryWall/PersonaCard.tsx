import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryWallPersona } from '@/mocks/historyWallPersonas';
import { ARCHETYPE_CONFIG } from '@/mocks/historyWallPersonas';

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
  if (years < 1.5) return '1 year ago';
  return `${years.toFixed(0)} years ago`;
}

function loyaltyLabel(tier?: string, expired?: boolean): string {
  if (expired) return 'Loyalty Expired';
  if (!tier) return 'No Loyalty';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function loyaltyColor(tier?: string, expired?: boolean): string {
  if (expired || !tier) return 'text-stone-500';
  if (tier === 'platinum') return 'text-cyan-300';
  if (tier === 'gold') return 'text-amber-300';
  if (tier === 'silver') return 'text-slate-300';
  return 'text-amber-700';
}

function identityBadge(tier: 'known' | 'appended' | 'anonymous'): { label: string; classes: string } {
  if (tier === 'known') return { label: 'Known', classes: 'bg-emerald-500/15 text-emerald-400' };
  if (tier === 'appended') return { label: '3P Appended', classes: 'bg-indigo-500/15 text-indigo-400' };
  return { label: 'Anonymous', classes: 'bg-neutral-500/15 text-neutral-500' };
}

// ─── Claim Detail Modal ────────────────────────────────────────────────────────

interface ClaimModalProps {
  persona: HistoryWallPersona;
  onConfirm: () => void;
  onCancel: () => void;
}

function ClaimModal({ persona, onConfirm, onCancel }: ClaimModalProps) {
  const cfg = ARCHETYPE_CONFIG[persona.archetype];
  const { seedData } = persona;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

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
              <p className="text-sm text-white/50 mt-0.5">{persona.city}{persona.state ? `, ${persona.state}` : ''} · Age {persona.age > 0 ? persona.age : '?'}</p>
            </div>
            <button onClick={onCancel} className="text-white/40 hover:text-white/70 transition-colors mt-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-white/40 mt-3 italic">"{cfg.tagline}"</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">

          {/* Engagement seed summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
              Engagement History — Seeded to Salesforce
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
              What the Optimization Engine Would Do
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

          {/* Appended data note */}
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
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-stone-900 border-t border-white/10 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-[11px] text-white/30">
            Claiming seeds this engagement history into Salesforce CRM + Data Cloud
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-full text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-full bg-white text-stone-900 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Claim this persona →
            </button>
          </div>
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
  onClaim: (persona: HistoryWallPersona) => void;
}

export function PersonaCard({ persona, claimCount, isClaimed, onClaim }: PersonaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const cfg = ARCHETYPE_CONFIG[persona.archetype];
  const idBadge = identityBadge(persona.seedData.identityTier);

  function handleConfirm() {
    setShowModal(false);
    onClaim(persona);
  }

  return (
    <>
      <motion.div
        layout
        className={`
          relative flex flex-col bg-stone-900 border border-white/8 rounded-2xl overflow-hidden
          transition-colors duration-200 cursor-pointer group
          ${isClaimed ? 'border-white/20 ring-1 ring-white/15' : `${cfg.cardBorder}`}
        `}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        onClick={() => setShowModal(true)}
      >
        {/* Top color accent */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${persona.avatarGradient}`} />

        {/* Card body */}
        <div className="flex flex-col flex-1 p-5 gap-4">

          {/* Header row: archetype badge + claim count */}
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

          {/* Avatar + identity */}
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
                {loyaltyLabel(persona.loyaltyTier, persona.loyaltyExpired).split(' ')[0]}
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Loyalty</p>
            </div>
          </div>

          {/* Last active */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Last active:</span>
            <span className={`text-[10px] font-medium ${persona.lastActiveDaysAgo > 365 ? 'text-red-400/70' : persona.lastActiveDaysAgo > 120 ? 'text-orange-400/70' : 'text-emerald-400/70'}`}>
              {persona.lastActiveDaysAgo > 900 ? 'Never' : relativeTime(persona.lastActiveDaysAgo)}
            </span>
          </div>

          {/* Key interests */}
          {persona.keyInterests[0] !== 'unknown' && (
            <div className="flex flex-wrap gap-1.5">
              {persona.keyInterests.slice(0, 3).map((interest) => (
                <span key={interest} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Optimization tagline */}
          <p className="text-[11px] text-white/35 italic leading-relaxed border-t border-white/8 pt-3">
            {cfg.tagline}
          </p>

          {/* Identity badge + channel */}
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
              <span className="text-sm font-medium text-emerald-400">Persona Claimed</span>
            </div>
          ) : (
            <>
              <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                View full profile →
              </span>
              <span className="text-[10px] text-white/20">
                {persona.seedData.orders.length} orders · {persona.seedData.meaningfulEvents.length} events
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Claim modal */}
      <AnimatePresence>
        {showModal && (
          <ClaimModal
            persona={persona}
            onConfirm={handleConfirm}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
