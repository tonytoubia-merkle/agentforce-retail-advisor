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
  /** True for anonymous / 3P-appended personas — no CRM record, routes to acquisition */
  acquisitionOnly?: boolean;
}

// ─── Seed function ────────────────────────────────────────────────────────────

/**
 * Sends a persona's full engagement history to the server, which writes it
 * into Salesforce CRM (Contact + custom objects + Orders).
 *
 * For anonymous and appended-only personas (no email, no 1P identity), the
 * function short-circuits before calling the server and returns a synthetic
 * result that tells the acquisition story instead of producing an error.
 *
 * The server uses its own OAuth token (client credentials), so no token
 * needs to be passed from the browser.
 */
export async function seedPersonaToSalesforce(persona: HistoryWallPersona): Promise<SeedResult> {
  const { id: personaId, seedData } = persona;

  // Anonymous / appended personas have no email and no CRM identity.
  // Rather than failing, we short-circuit and tell the acquisition story.
  if (seedData.identityTier !== 'known' || !persona.email) {
    return {
      success: true,
      personaId,
      contactId: '',
      acquisitionOnly: true,
      recordsCreated: {
        contact: null,
        chatSummaries: 0,
        meaningfulEvents: 0,
        browseSessions: 0,
        agentProfileFields: 0,
        orders: 0,
        errors: [],
      },
    };
  }

  const body = {
    personaId,
    seedData: {
      email: persona.email,
      displayName: persona.displayName,
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
