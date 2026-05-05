import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HISTORY_WALL_PERSONAS,
  ARCHETYPE_FILTER_GROUPS,
  type HistoryWallPersona,
  type EngagementArchetype,
} from '@/mocks/historyWallPersonas';
import {
  recordPersonaSelection,
  fetchSelectionCounts,
  subscribeToSelections,
  getOrCreateSessionId,
} from '@/services/supabase/historyWall';
import { seedPersonaToSalesforce } from '@/services/salesforce/seedPersona';
import { PersonaCard } from './PersonaCard';

// ─── Claimed-persona persistence (sessionStorage) ─────────────────────────────

const CLAIMED_KEY = 'hw_claimed_persona';

function getClaimedFromStorage(): string | null {
  return sessionStorage.getItem(CLAIMED_KEY);
}

function saveClaimedToStorage(id: string) {
  sessionStorage.setItem(CLAIMED_KEY, id);
}

// ─── HistoryWallPage ──────────────────────────────────────────────────────────

export function HistoryWallPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectionCounts, setSelectionCounts] = useState<Record<string, number>>({});
  const [claimedPersonaId, setClaimedPersonaId] = useState<string | null>(getClaimedFromStorage);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedPersona, setClaimedPersona] = useState<HistoryWallPersona | null>(null);

  // Load initial counts + subscribe to real-time updates
  useEffect(() => {
    fetchSelectionCounts().then(setSelectionCounts);
    const unsub = subscribeToSelections(setSelectionCounts);
    return unsub;
  }, []);

  // Called by the modal after seeding completes (success or error — card is claimed either way)
  const handleClaimComplete = useCallback((persona: HistoryWallPersona) => {
    const sessionId = getOrCreateSessionId();
    void recordPersonaSelection(persona.id, sessionId);
    saveClaimedToStorage(persona.id);
    setClaimedPersonaId(persona.id);
    setClaimedPersona(persona);
    setShowSuccess(true);
    fetchSelectionCounts().then(setSelectionCounts);
  }, []);

  // Filtered personas
  const filterGroup = ARCHETYPE_FILTER_GROUPS.find((g) => g.label === activeFilter);
  const displayedPersonas: HistoryWallPersona[] = filterGroup?.archetypes
    ? HISTORY_WALL_PERSONAS.filter((p) => (filterGroup.archetypes as readonly EngagementArchetype[]).includes(p.archetype))
    : HISTORY_WALL_PERSONAS;

  const totalClaims = Object.values(selectionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Engagement History Wall</h1>
                <p className="text-[11px] text-white/40 leading-tight">
                  16 audience archetypes · Seed the optimization engine
                </p>
              </div>
            </div>

            {/* Live counter + nav */}
            <div className="flex items-center gap-4">
              {totalClaims > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">{totalClaims} claimed live</span>
                </div>
              )}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Explainer bar ── */}
      <div className="border-b border-white/5 bg-stone-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Pick a persona that resonates with you — your engagement history seeds the campaign optimizer
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Each card represents a real engagement archetype with purchase history, life events, and behavioral signals
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Diverse selections = richer optimization signal for the live campaign wizard demo
            </span>
          </div>
        </div>
      </div>

      {/* ── Claimed persona banner ── */}
      {showSuccess && claimedPersona && (
        <motion.div
          className="border-b border-emerald-500/20 bg-emerald-900/20"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${claimedPersona.avatarGradient} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-bold">{claimedPersona.avatarInitials}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  You've claimed <strong>{claimedPersona.displayName}</strong>
                </p>
                <p className="text-[11px] text-emerald-400/60">
                  {claimedPersona.seedData.orders.length} orders · {claimedPersona.seedData.meaningfulEvents.length} life events · {claimedPersona.seedData.browseSessions.length} browse sessions seeded to Salesforce
                </p>
              </div>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-emerald-400/40 hover:text-emerald-400/70">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 flex-shrink-0 mr-1">
            Filter:
          </span>
          {ARCHETYPE_FILTER_GROUPS.map((group) => {
            const isActive = activeFilter === group.label;
            const count = group.archetypes
              ? HISTORY_WALL_PERSONAS.filter((p) => (group.archetypes as readonly EngagementArchetype[]).includes(p.archetype)).length
              : HISTORY_WALL_PERSONAS.length;
            return (
              <button
                key={group.label}
                onClick={() => setActiveFilter(group.label)}
                className={`
                  flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-white text-stone-900'
                    : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'
                  }
                `}
              >
                {group.label}
                <span className={`ml-1.5 text-[10px] ${isActive ? 'text-stone-600' : 'text-white/25'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Card grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {displayedPersonas.map((persona) => (
            <motion.div
              key={persona.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <PersonaCard
                persona={persona}
                claimCount={selectionCounts[persona.id] ?? 0}
                isClaimed={claimedPersonaId === persona.id}
                onSeed={seedPersonaToSalesforce}
                onClaimComplete={handleClaimComplete}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Legend ── */}
        <div className="mt-14 pt-8 border-t border-white/5 space-y-6">

          {/* Archetype legend */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-3">
              Engagement Archetypes — What Each Profile Signals
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { label: 'Champion', color: 'bg-amber-400', desc: 'Upsell to premium + referral ask' },
                { label: 'Actively Engaged', color: 'bg-emerald-400', desc: 'Cross-sell while engagement is high' },
                { label: 'Browse Ghost', color: 'bg-slate-400', desc: 'High intent, zero conversion — first-purchase offer' },
                { label: 'Loyalty Dormant', color: 'bg-purple-400', desc: 'Points-expiry creates re-engagement urgency' },
                { label: 'Recently Lapsed', color: 'bg-orange-400', desc: 'Win-back window open (90–180 days)' },
                { label: 'One-And-Done', color: 'bg-yellow-400', desc: 'Single purchase — life event or gift trigger re-entry' },
                { label: 'Long Lapsed', color: 'bg-zinc-400', desc: 'Loyalty expired — needs meaningful re-entry reason' },
                { label: 'Churned', color: 'bg-red-500', desc: 'Suppress from standard sends — test with premium offer' },
                { label: 'New Purchaser', color: 'bg-teal-400', desc: 'Onboarding window critical (days 7–21)' },
                { label: 'Cart Abandoner', color: 'bg-sky-400', desc: '1hr / 24hr / 72hr abandonment sequence' },
                { label: 'Life Event', color: 'bg-rose-400', desc: 'Time-sensitive trigger — urgency × high AOV' },
                { label: 'Niche Collector', color: 'bg-amber-500', desc: 'Category specialist — suppress cross-category noise' },
                { label: 'Gift Buyer', color: 'bg-pink-400', desc: 'Seasonal calendar drives all engagement' },
                { label: 'Appended Prospect', color: 'bg-indigo-400', desc: 'Lookalike acquisition from 3P identity signal' },
                { label: 'Anonymous', color: 'bg-neutral-500', desc: 'Identity capture first — personalization follows' },
              ].map(({ label, color, desc }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${color} mt-1.5 flex-shrink-0`} />
                  <div>
                    <span className="text-[11px] font-medium text-white/60">{label}</span>
                    <span className="text-[10px] text-white/25 block">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identity tier legend */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-3">Identity Tiers</p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">Known</span>
                <span className="text-white/30">1P CRM record — direct personalization</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 text-[10px]">3P Appended</span>
                <span className="text-white/30">Merkury append — influence only, no direct reference</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-neutral-500/15 text-neutral-500 text-[10px]">Anonymous</span>
                <span className="text-white/30">No identity resolved — capture is the first campaign</span>
              </span>
            </div>
          </div>

          {/* Seed metadata note */}
          <p className="text-[10px] text-white/20 max-w-3xl">
            Claiming a persona seeds its engagement history (orders, browse sessions, agent conversation summaries, meaningful life events)
            into Salesforce CRM and Data Cloud via the existing contact + custom object schema. The campaign wizard then reads
            these profiles to demonstrate dynamic audience segmentation, journey enrollment, and media flighting optimization.
          </p>

        </div>
      </div>
    </div>
  );
}
