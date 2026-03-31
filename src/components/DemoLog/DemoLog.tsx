import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { demoLog, type LogEntry, type EventCategory } from '@/services/demoLog';

// ─── Category visual config ──────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; dotColor: string; icon: string }> = {
  navigation:      { label: 'Nav',    color: 'text-slate-400',   dotColor: 'bg-slate-400',   icon: '🧭' },
  identity:        { label: 'ID',     color: 'text-violet-400',  dotColor: 'bg-violet-400',  icon: '🔑' },
  personalization: { label: 'Perso',  color: 'text-cyan-400',    dotColor: 'bg-cyan-400',    icon: '✨' },
  campaign:        { label: 'UTM',    color: 'text-amber-400',   dotColor: 'bg-amber-400',   icon: '📡' },
  agent:           { label: 'Agent',  color: 'text-emerald-400', dotColor: 'bg-emerald-400', icon: '🤖' },
  commerce:        { label: 'Shop',   color: 'text-blue-400',    dotColor: 'bg-blue-400',    icon: '🛒' },
  'data-capture':  { label: 'Data',   color: 'text-rose-400',    dotColor: 'bg-rose-400',    icon: '💾' },
  system:          { label: 'Sys',    color: 'text-stone-500',   dotColor: 'bg-stone-500',   icon: '⚙️' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as EventCategory[];

// ─── Time formatting ─────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ─── Detail row renderer ─────────────────────────────────────────────────────

function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-white/20">—</span>;
  if (typeof value === 'boolean') return <span className={value ? 'text-emerald-400' : 'text-red-400'}>{String(value)}</span>;
  if (typeof value === 'object') return <span className="text-white/40">{JSON.stringify(value)}</span>;
  return <span className="text-white/70">{String(value)}</span>;
}

// ─── Single log entry ────────────────────────────────────────────────────────

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[entry.category];
  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="group relative pl-5 pb-3"
    >
      {/* Timeline dot */}
      <div className={`absolute left-0 top-[7px] w-2 h-2 rounded-full ${cfg.dotColor} ring-2 ring-stone-900`} />
      {/* Timeline line */}
      <div className="absolute left-[3px] top-[15px] bottom-0 w-px bg-white/5" />

      {/* Timestamp + category */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-mono text-white/25 tabular-nums w-8 flex-shrink-0">
          {formatTime(entry.timestamp)}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 font-medium ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Title + subtitle */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`text-left w-full ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="text-[11px] font-medium text-white/80 leading-tight">
          {entry.title}
        </div>
        {entry.subtitle && (
          <div className="text-[10px] text-white/35 leading-tight mt-0.5 truncate">
            {entry.subtitle}
          </div>
        )}
        {hasDetails && !expanded && (
          <div className="text-[9px] text-white/15 mt-0.5 group-hover:text-white/30 transition-colors">
            click to expand
          </div>
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && entry.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-2 rounded-md bg-white/[0.03] border border-white/5 space-y-1">
              {Object.entries(entry.details).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2 text-[10px]">
                  <span className="text-white/30 flex-shrink-0 min-w-[70px]">{key}:</span>
                  <span className="break-all"><DetailValue value={val} /></span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main DemoLog panel ──────────────────────────────────────────────────────

export const DemoLog: React.FC = () => {
  // Store entries in React state — the ONLY source of truth for rendering.
  // Synced from the singleton via poll + DOM event.
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(new Set(ALL_CATEGORIES));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastVersionRef = useRef(-1);

  useEffect(() => {
    const sync = () => {
      // Only update state if the singleton has new entries
      if (demoLog.version !== lastVersionRef.current) {
        lastVersionRef.current = demoLog.version;
        // Spread into a NEW array so React always sees a new reference
        setEntries([...demoLog.entries]);
      }
    };

    // DOM event for future entries
    window.addEventListener('demolog', sync);

    // Poll every 150ms for 4s to catch initial burst
    const poll = setInterval(sync, 150);
    const stopPoll = setTimeout(() => clearInterval(poll), 4000);

    // Immediate sync on mount
    sync();

    return () => {
      window.removeEventListener('demolog', sync);
      clearInterval(poll);
      clearTimeout(stopPoll);
    };
  }, []);
  const filtered = entries.filter(e => activeFilters.has(e.category));

  // Auto-open the panel when entries exist
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoOpenedRef.current && entries.length > 0) {
      hasAutoOpenedRef.current = true;
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [entries.length]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 60);
  }, []);

  const toggleFilter = (cat: EventCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const allActive = activeFilters.size === ALL_CATEGORIES.length;

  return (
    <>
      {/* Collapsed tab — always visible on right edge */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 bg-stone-900/95 border border-white/10 border-r-0 rounded-l-lg px-2 py-3 shadow-xl hover:bg-stone-800 transition-colors"
            style={{ writingMode: 'vertical-lr' }}
          >
            <span className="text-[10px] font-medium text-white/60 tracking-wider uppercase">
              Demo Log
            </span>
            {entries.length > 0 && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono" style={{ writingMode: 'horizontal-tb' }}>
                {entries.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed right-0 top-0 h-screen w-[380px] z-50 flex flex-col bg-stone-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Live Demo Log
                  </h2>
                  <span className="text-[9px] text-white/25 font-mono">
                    {entries.length} events
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => demoLog.clear()}
                    className="text-[9px] px-1.5 py-0.5 rounded text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors"
                    title="Clear log"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveFilters(new Set(allActive ? [] : ALL_CATEGORIES))}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                    allActive
                      ? 'bg-white/10 text-white/60'
                      : 'bg-white/5 text-white/25 hover:text-white/40'
                  }`}
                >
                  All
                </button>
                {ALL_CATEGORIES.map(cat => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const active = activeFilters.has(cat);
                  const count = entries.filter(e => e.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleFilter(cat)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${
                        active ? `bg-white/10 ${cfg.color}` : 'bg-white/5 text-white/20 hover:text-white/35'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                      {count > 0 && <span className="text-[8px] opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable log */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-0"
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="text-2xl mb-2 opacity-30">📋</div>
                  <p className="text-[11px] text-white/20">
                    Events will appear here as you interact with the storefront
                  </p>
                </div>
              ) : (
                filtered.map(entry => <LogEntryRow key={entry.id} entry={entry} />)
              )}
            </div>

            {/* Auto-scroll indicator */}
            {!autoScroll && filtered.length > 0 && (
              <button
                onClick={() => {
                  setAutoScroll(true);
                  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-medium border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors shadow-lg"
              >
                ↓ New events
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
