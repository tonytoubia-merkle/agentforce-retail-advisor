/**
 * Global demo event log.
 *
 * Uses window.__demoLogEntries as the single source of truth to avoid
 * Vite chunk splitting creating duplicate module instances.
 */

export type EventCategory =
  | 'navigation'
  | 'identity'
  | 'personalization'
  | 'campaign'
  | 'agent'
  | 'commerce'
  | 'data-capture'
  | 'system';

export interface LogEntry {
  id: string;
  timestamp: number;
  category: EventCategory;
  title: string;
  subtitle?: string;
  details?: Record<string, unknown>;
}

declare global {
  interface Window {
    __demoLogEntries: LogEntry[];
    __demoLogStart: number;
    __demoLogNextId: number;
  }
}

// Initialize on window — guaranteed single instance across all chunks
if (!window.__demoLogEntries) {
  window.__demoLogEntries = [];
  window.__demoLogStart = Date.now();
  window.__demoLogNextId = 0;
}

function getEntries(): LogEntry[] {
  return window.__demoLogEntries;
}

export const demoLog = {
  get entries() { return getEntries(); },

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const entries = getEntries();
    entries.push({
      ...entry,
      id: String(++window.__demoLogNextId),
      timestamp: Date.now() - window.__demoLogStart,
    });
    if (entries.length > 500) entries.splice(0, entries.length - 400);
  },

  clear() {
    window.__demoLogEntries = [];
  },
};
