/**
 * Global demo event log — append-only queue architecture.
 *
 * demoLog.log() pushes to both a permanent entries array AND a pending queue.
 * DemoLog component drains the pending queue and APPENDS to its own React state.
 * This eliminates all "read stale snapshot" timing issues.
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

/** Entries not yet consumed by the DemoLog component. */
const pending: LogEntry[] = [];

class DemoEventLog {
  entries: LogEntry[] = [];

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const e: LogEntry = {
      ...entry,
      id: String(++nextId),
      timestamp: Date.now() - SESSION_START,
    };
    this.entries.push(e);
    pending.push(e);
    if (this.entries.length > 500) this.entries.splice(0, this.entries.length - 400);
    window.dispatchEvent(new Event('demolog'));
  }

  clear() {
    this.entries.length = 0;
    pending.length = 0;
    window.dispatchEvent(new Event('demolog-clear'));
  }
}

/** Drain pending entries — returns new entries not yet consumed. */
export function drainPending(): LogEntry[] {
  if (pending.length === 0) return [];
  return pending.splice(0, pending.length);
}

export const demoLog = new DemoEventLog();
