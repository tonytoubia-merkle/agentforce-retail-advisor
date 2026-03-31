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
    // Create a NEW array reference on every mutation so useSyncExternalStore
    // detects the change (it compares snapshots via Object.is).
    this.entries = [
      ...(this.entries.length > 500 ? this.entries.slice(-400) : this.entries),
      { ...entry, id: String(++nextId), timestamp: Date.now() - SESSION_START },
    ];
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
