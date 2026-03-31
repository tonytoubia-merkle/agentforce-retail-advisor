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

let nextId = 0;
const SESSION_START = Date.now();

class DemoEventLog {
  entries: LogEntry[] = [];
  version = 0;

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    this.entries = [
      ...(this.entries.length > 500 ? this.entries.slice(-400) : this.entries),
      { ...entry, id: String(++nextId), timestamp: Date.now() - SESSION_START },
    ];
    this.version++;
    // Fire a native DOM event — this is NOT subject to React batching,
    // so listeners attached via addEventListener always get notified.
    window.dispatchEvent(new Event('demolog'));
  }


  clear() {
    this.entries = [];
    this.version++;
    window.dispatchEvent(new Event('demolog'));
  }
}

export const demoLog = new DemoEventLog();
