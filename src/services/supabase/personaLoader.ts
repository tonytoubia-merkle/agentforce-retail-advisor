/**
 * Persona loader — fetches custom personas from Supabase for non-default demos,
 * falling back to mock data for the golden template.
 */

import type { PersonaMeta } from '@/mocks/customerPersonas';
import type { CustomerProfile } from '@/types/customer';
import { PERSONAS, getPersonaById as getMockPersonaById } from '@/mocks/customerPersonas';
import { getDemoPersonas } from '@/services/supabase/demoService';
import { getDemoConfig } from '@/contexts/DemoContext';

// Cache to avoid re-fetching on every persona switch
let _cachedDemoId: string | null = null;
let _cachedPersonas: PersonaMeta[] | null = null;

/**
 * Build a CustomerProfile from a Supabase demo_persona record's profile JSON.
 * The profile JSON may be partial — fill in sensible defaults.
 */
function buildProfile(personaKey: string, label: string, profileJson: Record<string, any>): CustomerProfile {
  return {
    id: `persona-${personaKey}`,
    name: profileJson.name || label.split(' ')[0],
    email: profileJson.email || `${personaKey}@example.com`,
    beautyProfile: profileJson.beautyProfile || {
      skinType: 'normal',
      concerns: [],
      allergies: [],
      fragrancePreference: 'no-preference',
      communicationPrefs: { email: true, sms: false, push: false },
      preferredBrands: [],
      ageRange: '25-35',
    },
    loyalty: profileJson.loyalty || undefined,
    ...(profileJson.merkuryId ? { merkuryId: profileJson.merkuryId } : {}),
    ...(profileJson.identityTier ? { identityTier: profileJson.identityTier } : {}),
  } as CustomerProfile;
}

/**
 * Get personas for the current demo.
 * - Default demo → returns mock PERSONAS
 * - Custom demo → fetches from Supabase demo_personas, converts to PersonaMeta[]
 */
export async function loadPersonas(): Promise<PersonaMeta[]> {
  const config = getDemoConfig();

  // Default demo: use mocks
  if (config.id === 'default') {
    return PERSONAS;
  }

  // Check cache
  if (_cachedDemoId === config.id && _cachedPersonas) {
    return _cachedPersonas;
  }

  try {
    const dbPersonas = await getDemoPersonas(config.id);
    if (!dbPersonas.length) {
      // No custom personas — fall back to mocks
      return PERSONAS;
    }

    const personas: PersonaMeta[] = dbPersonas.map((p) => ({
      id: p.personaKey,
      label: p.label,
      subtitle: p.subtitle || '',
      traits: p.traits || [],
      profile: buildProfile(p.personaKey, p.label, p.profile || {}),
    }));

    _cachedDemoId = config.id;
    _cachedPersonas = personas;
    return personas;
  } catch (err) {
    console.warn('[personaLoader] Failed to load from Supabase, using mocks:', err);
    return PERSONAS;
  }
}

/**
 * Get a single persona by ID — checks Supabase cache first, then mocks.
 */
export async function loadPersonaById(id: string): Promise<PersonaMeta | undefined> {
  const all = await loadPersonas();
  return all.find((p) => p.id === id) || getMockPersonaById(id);
}

/**
 * Clear the persona cache (e.g., when switching demos).
 */
export function clearPersonaCache(): void {
  _cachedDemoId = null;
  _cachedPersonas = null;
}
