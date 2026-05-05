import { getSupabase, isSupabaseConfigured } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonaSelectionCount {
  personaId: string;
  count: number;
}

// ─── Supabase table: persona_selections ───────────────────────────────────────
// Schema (run once):
//   create table persona_selections (
//     id          uuid primary key default gen_random_uuid(),
//     persona_id  text not null,
//     session_id  text not null,
//     selected_at timestamptz not null default now()
//   );
//   create index on persona_selections(persona_id);

const TABLE = 'persona_selections';

/**
 * Record a persona selection. Uses a randomly generated session ID so
 * the same browser session can only count once per persona.
 */
export async function recordPersonaSelection(personaId: string, sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await getSupabase().from(TABLE).upsert(
      { persona_id: personaId, session_id: sessionId, selected_at: new Date().toISOString() },
      { onConflict: 'session_id' },
    );
  } catch {
    // Non-blocking — selection count is cosmetic in the demo
  }
}

/**
 * Fetch all selection counts keyed by persona ID.
 * Falls back to an empty map if Supabase is unavailable.
 */
export async function fetchSelectionCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .select('persona_id');
    if (error || !data) return {};
    const counts: Record<string, number> = {};
    for (const row of data as { persona_id: string }[]) {
      counts[row.persona_id] = (counts[row.persona_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Subscribe to real-time changes on the persona_selections table.
 * Calls `onUpdate` with fresh counts whenever a row is inserted.
 * Returns an unsubscribe function.
 */
export function subscribeToSelections(
  onUpdate: (counts: Record<string, number>) => void,
): () => void {
  if (!isSupabaseConfigured()) return () => {};
  const channel = getSupabase()
    .channel('persona-selections')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, async () => {
      const counts = await fetchSelectionCounts();
      onUpdate(counts);
    })
    .subscribe();
  return () => {
    void getSupabase().removeChannel(channel);
  };
}

// ─── Session ID ───────────────────────────────────────────────────────────────
// Persisted in sessionStorage so a refresh doesn't create a second vote,
// but a new tab/browser does.

const SESSION_KEY = 'hw_session_id';

export function getOrCreateSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}
