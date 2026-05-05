import type { HistoryWallPersona } from '@/mocks/historyWallPersonas';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeedRecordCounts {
  contact: 'found' | 'created' | null;
  chatSummaries: number;
  meaningfulEvents: number;
  browseSessions: number;
  agentProfileFields: number;
  orders: number;
  errors: string[];
}

export interface SeedResult {
  success: boolean;
  personaId: string;
  contactId: string;
  recordsCreated: SeedRecordCounts;
}

// ─── Seed function ────────────────────────────────────────────────────────────

/**
 * Sends a persona's full engagement history to the server, which writes it
 * into Salesforce CRM (Contact + custom objects + Orders).
 *
 * The server uses its own OAuth token (client credentials), so no token
 * needs to be passed from the browser.
 */
export async function seedPersonaToSalesforce(persona: HistoryWallPersona): Promise<SeedResult> {
  const { id: personaId, email, displayName, seedData } = persona;

  const body = {
    personaId,
    seedData: {
      email,
      displayName,
      identityTier: seedData.identityTier,
      orders: seedData.orders,
      browseSessions: seedData.browseSessions,
      chatSummaries: seedData.chatSummaries,
      meaningfulEvents: seedData.meaningfulEvents,
      agentCapturedProfile: seedData.agentCapturedProfile,
    },
  };

  const res = await fetch('/api/seed-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Seed failed with status ${res.status}`);
  }

  return data as SeedResult;
}
