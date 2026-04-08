import { useState, useRef, useEffect, useCallback } from 'react';
import { demoLog, type LogEntry, type EventCategory } from '@/services/demoLog';
import { DemoPanelInline } from '@/components/Storefront/DemoPanel';

type DemoTab = 'log' | 'profile';

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

// ─── Main DemoLog panel ──────────────────────────────────────────────────────

export const DemoLog: React.FC<{ onOpenChange?: (open: boolean) => void }> = ({ onOpenChange }) => {
  const [open, setOpenRaw] = useState(false);
  const setOpen = useCallback((v: boolean) => {
    setOpenRaw(v);
    onOpenChange?.(v);
  }, [onOpenChange]);
  const [activeTab, setActiveTab] = useState<DemoTab>('log');
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(new Set(ALL_CATEGORIES));
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const renderedCountRef = useRef(0);
  // Counter just for filter chip counts + auto-open — not for rendering entries
  const [entryCount, setEntryCount] = useState(0);

  // Render entries via direct DOM manipulation — completely bypasses React
  useEffect(() => {
    const activeSet = activeFilters;

    const renderEntry = (entry: LogEntry) => {
      const container = listRef.current;
      if (!container) return;
      if (!activeSet.has(entry.category)) return;

      const cfg = CATEGORY_CONFIG[entry.category];
      const div = document.createElement('div');
      div.className = 'demolog-entry';
      div.style.cssText = 'position:relative;padding-left:20px;padding-bottom:12px;animation:fadeInRight 0.2s ease';
      div.innerHTML = `
        <div style="position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 2px #0c0a09" class="${cfg.dotColor}"></div>
        <div style="position:absolute;left:3px;top:15px;bottom:0;width:1px;background:rgba(255,255,255,0.05)"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span style="font-size:10px;font-family:monospace;color:rgba(255,255,255,0.25);width:32px;flex-shrink:0">${formatTime(entry.timestamp)}</span>
          <span style="font-size:9px;padding:2px 6px;border-radius:9999px;background:rgba(255,255,255,0.05);font-weight:500" class="${cfg.color}">${cfg.icon} ${cfg.label}</span>
        </div>
        <div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.8);line-height:1.3">${entry.title}</div>
        ${entry.subtitle ? `<div style="font-size:10px;color:rgba(255,255,255,0.35);line-height:1.3;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${entry.subtitle}</div>` : ''}
      `;
      container.appendChild(div);
    };

    const poll = setInterval(() => {
      const all = demoLog.entries;
      if (all.length > renderedCountRef.current) {
        for (let i = renderedCountRef.current; i < all.length; i++) {
          renderEntry(all[i]);
        }
        renderedCountRef.current = all.length;
        setEntryCount(all.length);

        // Auto-scroll
        if (scrollRef.current) {
          const el = scrollRef.current;
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          if (nearBottom) el.scrollTop = el.scrollHeight;
        }
      }
    }, 200);

    return () => clearInterval(poll);
  }, [activeFilters]);

  // Auto-open
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoOpenedRef.current && entryCount > 0) {
      hasAutoOpenedRef.current = true;
      setTimeout(() => setOpen(true), 600);
    }
  }, [entryCount]);

  // For filter counts
  const entries = demoLog.entries;

  const handleScroll = useCallback(() => {}, []);

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

  // Panel uses width transition. listRef is ALWAYS in the DOM.
  return (
    <>
      <style>{`@keyframes fadeInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>

      {/* Collapsed tab — fixed position, always clickable when panel is closed */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1.5 bg-stone-900/95 border border-white/10 border-r-0 rounded-l-lg px-2 py-3 shadow-xl hover:bg-stone-800 transition-all"
        style={{ writingMode: 'vertical-lr', opacity: open ? 0 : 1, pointerEvents: open ? 'none' : 'auto' }}
      >
          <span className="text-[10px] font-medium text-white/60 tracking-wider uppercase">Demo</span>
          {entryCount > 0 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono" style={{ writingMode: 'horizontal-tb' }}>
              {entryCount}
            </span>
          )}
        </button>

      {/* Panel — flex sibling that takes real space in layout */}
      <div
        className="h-screen flex-shrink-0 bg-stone-950 border-l border-white/10 shadow-2xl transition-[width] duration-300 ease-out overflow-hidden"
        style={{ width: open ? 380 : 0 }}
      >
        {/* Inner — fixed 380px so content doesn't squish during width transition */}
        <div className="w-[380px] h-full flex flex-col">
        {/* Header with tabs */}
        <div className="flex-shrink-0 border-b border-white/5">
          <div className="flex items-center justify-between px-3 pt-2 pb-0">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Demo</h2>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex px-3 mt-1">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 text-[10px] font-medium border-b-2 transition-colors ${
                activeTab === 'log' ? 'border-emerald-400 text-white/80' : 'border-transparent text-white/30 hover:text-white/50'
              }`}
            >
              Log {entryCount > 0 ? `(${entryCount})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-[10px] font-medium border-b-2 transition-colors ${
                activeTab === 'profile' ? 'border-emerald-400 text-white/80' : 'border-transparent text-white/30 hover:text-white/50'
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Tab: Log */}
        <div style={{ display: activeTab === 'log' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Filter chips */}
          <div className="flex-shrink-0 flex flex-wrap gap-1 px-3 py-2 border-b border-white/5">
            <button
              onClick={() => setActiveFilters(new Set(allActive ? [] : ALL_CATEGORIES))}
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${allActive ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/25 hover:text-white/40'}`}
            >All</button>
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = activeFilters.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleFilter(cat)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${active ? `bg-white/10 ${cfg.color}` : 'bg-white/5 text-white/20 hover:text-white/35'}`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
            <button
              onClick={() => { demoLog.clear(); renderedCountRef.current = 0; setEntryCount(0); if (listRef.current) listRef.current.innerHTML = ''; }}
              className="text-[9px] px-1.5 py-0.5 rounded-full text-white/20 hover:text-white/40 hover:bg-white/5 transition-colors ml-auto"
            >Clear</button>
          </div>

          {/* Scrollable log */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overscroll-contain p-3 dark-scrollbar">
            <div ref={listRef} />
            {entryCount === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="text-2xl mb-2 opacity-30">📋</div>
                <p className="text-[11px] text-white/20">Events will appear here as you interact with the storefront</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab: Profile (persona selector + profile detail from DemoPanel) */}
        <div style={{ display: activeTab === 'profile' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <DemoPanelInline />
        </div>
        </div>{/* close inner 380px wrapper */}
      </div>
    </>
  );
};
