/**
 * Global demo event log — singleton pub/sub for real-time explainability.
 *
 * Any service or context can `demoLog.log(...)` and the DemoLog panel
 * re-renders via a monotonic version counter (avoids React deduplication).
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

type Listener = () => void;

let nextId = 0;
const SESSION_START = Date.now();

class DemoEventLog {
  entries: LogEntry[] = [];
  /** Monotonic counter — increments on every mutation. Components can
   *  track this in state to guarantee re-renders even when React
   *  batches or deduplicates setState calls. */
  version = 0;
  private listeners = new Set<Listener>();

  private pendingNotify: number | null = null;

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    this.entries = [
      ...(this.entries.length > 500 ? this.entries.slice(-400) : this.entries),
      { ...entry, id: String(++nextId), timestamp: Date.now() - SESSION_START },
    ];
    this.version++;
    // Notify current subscribers synchronously
    this.listeners.forEach(fn => fn());
    // ALSO schedule a deferred notification — catches subscribers that
    // attach after this call (e.g. DemoLog mounting after App logs UTM).
    if (this.pendingNotify === null) {
      this.pendingNotify = window.setTimeout(() => {
        this.pendingNotify = null;
        this.listeners.forEach(fn => fn());
      }, 0);
    }
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  clear() {
    this.entries = [];
    this.version++;
    this.listeners.forEach(fn => fn());
  }
}

export const demoLog = new DemoEventLog();
