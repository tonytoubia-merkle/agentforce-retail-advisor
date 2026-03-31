/**
 * Global demo event log — singleton pub/sub for real-time explainability.
 *
 * Any service or context can `demoLog.log(...)` and the DemoLog panel
 * auto-renders new entries via `useSyncExternalStore`.
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
  private entries: LogEntry[] = [];
  private listeners = new Set<Listener>();

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    this.entries.push({
      ...entry,
      id: String(++nextId),
      timestamp: Date.now() - SESSION_START,
    });
    // Cap at 500 entries
    if (this.entries.length > 500) this.entries = this.entries.slice(-400);
    this.listeners.forEach(fn => fn());
  }

  getSnapshot = () => this.entries;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  clear() {
    this.entries = [];
    this.listeners.forEach(fn => fn());
  }
}

export const demoLog = new DemoEventLog();
