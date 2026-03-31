/**
 * Global demo event log.
 *
 * Architecture: append-only array + cursor-based consumption.
 * Entries are NEVER removed — consumers track their own read cursor.
 * This avoids the "splice then setState gets dropped" race condition.
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

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    this.entries.push({
      ...entry,
      id: String(++nextId),
      timestamp: Date.now() - SESSION_START,
    });
    if (this.entries.length > 500) this.entries.splice(0, this.entries.length - 400);
  }

  clear() {
    this.entries.length = 0;
  }
}

export const demoLog = new DemoEventLog();
