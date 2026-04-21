import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { CustomerProfile } from '@/types/customer';
import { resolveMerkuryIdentity } from '@/services/merkury/mockTag';
import { getPersonaById, PERSONAS } from '@/mocks/customerPersonas';
import { loadPersonas, loadPersonaById } from '@/services/supabase/personaLoader';
import { getDataCloudService } from '@/services/datacloud';
import { getMerkuryArchetypeByMerkuryId, getMerkuryArchetypeById } from '@/mocks/merkuryProfiles';
import { createContact } from '@/services/demo/contacts';
import { initPersonalization, isPersonalizationConfigured, syncIdentity, setPersonalizationProfile, clearPersonalizationContext } from '@/services/personalization';
import { demoLog } from '@/services/demoLog';
import { getDemoConfig } from '@/contexts/DemoContext';

interface CustomerContextValue {
  customer: CustomerProfile | null;
  selectedPersonaId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isResolving: boolean;
  error: Error | null;
  selectPersona: (personaId: string) => Promise<void>;
  signIn: () => void;
  signOut: () => void;
  identifyByEmail: (email: string) => Promise<boolean>;
  registerContact: (id: string) => Promise<void>;
  createGuestContact: (data: { email: string; firstName?: string; lastName?: string; merkuryId?: string }) => Promise<{ contactId: string; accountId: string } | null>;
  refreshProfile: () => Promise<void>;
  resetPersonaSession: (personaId: string) => void;
  /** Demo-legible loyalty enrollment — flips the current customer's loyalty
   *  state on client-side (Bronze tier, 500-point welcome bonus). Consumed
   *  by the cart's Loyalty Enroll prompt. No CRM write; purely for demo flow. */
  enrollInLoyalty: () => void;
  /** @internal Used by ConversationContext to detect refresh vs switch. */
  _isRefreshRef: React.MutableRefObject<boolean>;
  /** @internal Register callback for session reset notifications. */
  _onSessionReset: (cb: (personaId: string) => void) => () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const useMockData = getDemoConfig().featureFlags.useMockData;
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  /** When true, the next customer update is a profile refresh — don't reset conversation. */
  const isRefreshRef = useRef(false);
  /** Callbacks registered by ConversationContext to clear a persona's cached session. */
  const sessionResetCallbacksRef = useRef<Set<(personaId: string) => void>>(new Set());

  /** Register a callback to be notified when a persona session should be reset. */
  const onSessionReset = useCallback((cb: (personaId: string) => void) => {
    sessionResetCallbacksRef.current.add(cb);
    return () => { sessionResetCallbacksRef.current.delete(cb); };
  }, []);

  const signIn = useCallback(() => setIsAuthenticated(true), []);
  const signOut = useCallback(() => setIsAuthenticated(false), []);

  const selectPersona = useCallback(async (personaId: string) => {
    setSelectedPersonaId(personaId);
    setIsAuthenticated(false);
    setIsResolving(true);
    setError(null);

    try {
      // ─── CRM Contact ID branch ───────────────────────────────────
      // Detect Salesforce Contact IDs (15-18 char alphanumeric starting with 003).
      // Bypass Merkury resolution and fetch directly from Data Cloud.
      const isSalesforceId = /^[a-zA-Z0-9]{15,18}$/.test(personaId) && personaId.startsWith('003');
      if (isSalesforceId && !useMockData) {
        setIsLoading(true);
        try {
          const dataCloudService = getDataCloudService();
          const profile = await dataCloudService.getCustomerProfileById(personaId);
          // Cross-reference Merkury archetype for appended profile data
          const merkuryId = profile.merkuryIdentity?.merkuryId;
          if (merkuryId) {
            const archetype = getMerkuryArchetypeByMerkuryId(merkuryId);
            if (archetype) {
              profile.appendedProfile = archetype.appendedProfile;
            }
          }
          setCustomer(profile);
        } catch (err) {
          console.error('[customer] CRM profile fetch failed:', err);
          setError(err instanceof Error ? err : new Error('Failed to load CRM profile'));
          setCustomer(null);
        } finally {
          setIsLoading(false);
          setIsResolving(false);
        }
        return;
      }

      // Simulate Merkury tag resolution
      const resolution = await resolveMerkuryIdentity(personaId);
      console.log('[merkury] Identity resolved:', resolution.identityTier, 'confidence:', resolution.confidence);

      demoLog.log({
        category: 'identity',
        title: 'Merkury Identity Resolution',
        subtitle: `${resolution.identityTier} (${(resolution.confidence * 100).toFixed(0)}% confidence)`,
        details: {
          tier: resolution.identityTier,
          confidence: resolution.confidence,
          merkuryId: resolution.merkuryId,
          ...(resolution.appendedData ? {
            interests: resolution.appendedData.interests?.join(', '),
            ageRange: resolution.appendedData.ageRange,
            gender: resolution.appendedData.gender,
            income: resolution.appendedData.householdIncome,
          } : {}),
        },
      });

      // Appended-tier: Merkury resolved identity via 3P data only.
      // These people are NOT in Data Cloud — don't look them up there.
      // Build a minimal anonymous-like profile with only appended signals attached.
      // Name stays "Guest" — we only have 3P signals, not their actual identity.
      if (resolution.identityTier === 'appended') {
        const appendedProfile: CustomerProfile = {
          id: resolution.merkuryId || `appended-${personaId}`,
          name: 'Guest',
          email: '',
          beautyProfile: {} as CustomerProfile['beautyProfile'],
          orders: [],
          purchaseHistory: [],
          chatSummaries: [],
          meaningfulEvents: [],
          browseSessions: [],
          loyalty: null,
          savedPaymentMethods: [],
          shippingAddresses: [],
          recentActivity: [],
          merkuryIdentity: {
            merkuryId: resolution.merkuryId || '',
            identityTier: 'appended',
            confidence: resolution.confidence,
            resolvedAt: new Date().toISOString(),
          },
          appendedProfile: resolution.appendedData,
        };
        console.log('[customer] Appended-tier identity — using minimal profile with 3P signals only');
        demoLog.log({
          category: 'identity',
          title: 'Appended Profile Loaded',
          subtitle: '3rd-party data enrichment (no CRM match)',
          details: { interests: resolution.appendedData?.interests, lifestyle: resolution.appendedData?.lifestyleSignals },
        });
        setCustomer(appendedProfile);
      } else if (resolution.identityTier === 'anonymous' || !resolution.merkuryId) {
        // Anonymous: Merkury found no match. Stay on the default starting page —
        // no agent session, no welcome, no profile data. Just the baseline experience.
        console.log('[customer] Anonymous — no identity resolved, staying on default experience');
        demoLog.log({ category: 'identity', title: 'Anonymous Visitor', subtitle: 'No Merkury match — generic experience' });
        setCustomer(null);
      } else if (useMockData) {
        // MOCK MODE: Load known profiles from Supabase personas (custom demo) or mocks
        const persona = await loadPersonaById(personaId) || getPersonaById(personaId);
        if (persona) {
          setCustomer(persona.profile);
        } else {
          setCustomer(null);
        }
      } else {
        // REAL MODE: Fetch known profile from Data Cloud
        setIsLoading(true);
        // Stamp Merkury resolution onto the profile so the UI knows identity tier
        const merkuryIdentity = {
          merkuryId: resolution.merkuryId!,
          identityTier: resolution.identityTier,
          confidence: resolution.confidence,
          resolvedAt: new Date().toISOString(),
        };
        try {
          const dataCloudService = getDataCloudService();
          const profile = await dataCloudService.getCustomerProfile(resolution.merkuryId);
          profile.merkuryIdentity = merkuryIdentity;
          if (resolution.appendedData) profile.appendedProfile = resolution.appendedData;
          demoLog.log({
            category: 'identity',
            title: 'CRM Profile Loaded',
            subtitle: `${profile.name} (${profile.email})`,
            details: { id: profile.id, skinType: profile.beautyProfile?.skinType, orders: profile.orders?.length, loyalty: profile.loyalty?.tier },
          });
          setCustomer(profile);
        } catch (dcError) {
          console.error('[datacloud] Profile fetch failed:', dcError);
          setError(dcError instanceof Error ? dcError : new Error('Failed to load customer profile from Data Cloud'));
          setCustomer(null);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Identity resolution failed:', err);
      setError(err instanceof Error ? err : new Error('Identity resolution failed'));
      setCustomer(null);
    } finally {
      setIsResolving(false);
    }
  }, []);

  // Auto-select anonymous persona on mount so the app starts with a default experience
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Initialize SF Personalization SDK on app startup
      if (isPersonalizationConfigured()) {
        initPersonalization();
      }
      selectPersona('anonymous');
    }
  }, [selectPersona]);

  // Sync identity with SF Personalization / Data Cloud when customer profile changes
  // Include Merkury PID (Personal ID) and HID (Household ID) for identity resolution
  useEffect(() => {
    if (customer && isPersonalizationConfigured()) {
      syncIdentity(
        customer.email || undefined,
        customer.id,
        {
          pid: customer.merkuryIdentity?.merkuryPid || customer.merkuryIdentity?.merkuryId,
          hid: customer.merkuryIdentity?.merkuryHid,
        }
      );
      demoLog.log({
        category: 'system',
        title: 'Identity Synced → SF Personalization',
        subtitle: `PID: ${customer.merkuryIdentity?.merkuryId || 'none'}`,
        details: { email: customer.email, customerId: customer.id, hid: customer.merkuryIdentity?.merkuryHid },
      });
    }
  }, [customer?.id]);

  // Push Merkury appended data + beauty hints to SF Personalization as context variables.
  // These travel with every Personalization.fetch() call for first-page decisioning —
  // no waiting for Data Cloud ingestion or segment evaluation.
  useEffect(() => {
    if (!customer) {
      clearPersonalizationContext();
      return;
    }
    const appended = customer.appendedProfile;
    // Find matching Merkury archetype for beauty hints
    const merkuryId = customer.merkuryIdentity?.merkuryId;
    const archetype = merkuryId ? getMerkuryArchetypeByMerkuryId(merkuryId) : undefined;
    setPersonalizationProfile({
      interests: appended?.interests,
      ageRange: appended?.ageRange,
      gender: appended?.gender,
      householdIncome: appended?.householdIncome,
      lifestyleSignals: appended?.lifestyleSignals,
      geoRegion: appended?.geoRegion,
      skinType: archetype?.beautyHints?.skinType,
      skinConcerns: archetype?.beautyHints?.concerns,
      preferredBrands: archetype?.beautyHints?.preferredBrands,
      identityTier: customer.merkuryIdentity?.identityTier,
    });
  }, [customer?.id, customer?.appendedProfile]);

  /** Identify an anonymous user by email — find existing profile or create a new one.
   *  Uses isRefreshRef so the conversation is NOT reset. */
  const identifyByEmail = useCallback(async (email: string): Promise<boolean> => {
    setIsResolving(true);
    setError(null);

    try {
      let profile: CustomerProfile | null = null;

      if (useMockData) {
        // Search custom demo personas first, then mock personas by email
        const allPersonas = await loadPersonas();
        const match = allPersonas.find(
          (p) => p.profile.email.toLowerCase() === email.toLowerCase()
        );
        if (match) {
          profile = match.profile;
          console.log('[identity] Matched existing mock persona:', match.label);
        } else {
          // Create minimal new profile for unknown email
          const firstName = email.split('@')[0].split('.')[0];
          const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          profile = {
            id: `customer-${Date.now()}`,
            name,
            email,
            beautyProfile: { skinType: 'normal', concerns: [], allergies: [], preferredBrands: [] },
            orders: [],
            chatSummaries: [],
            meaningfulEvents: [],
            browseSessions: [],
            loyalty: null,
            purchaseHistory: [],
            savedPaymentMethods: [],
            shippingAddresses: [],
            recentActivity: [],
            merkuryIdentity: {
              merkuryId: `MRK-${Date.now()}`,
              identityTier: 'known',
              confidence: 0.85,
              resolvedAt: new Date().toISOString(),
            },
          };
          console.log('[identity] Created new mock profile for:', email);
        }
      } else {
        // Real mode: query Data Cloud by email
        try {
          const dataCloudService = getDataCloudService();
          profile = await dataCloudService.getCustomerProfileByEmail(email);
          profile.merkuryIdentity = {
            merkuryId: profile.id,
            identityTier: 'known',
            confidence: 0.9,
            resolvedAt: new Date().toISOString(),
          };
          console.log('[identity] Found existing profile in Data Cloud for:', email);
          demoLog.log({ category: 'identity', title: 'Email Identification', subtitle: `Matched CRM profile: ${email}`, details: { email, profileId: profile.id } });
        } catch {
          console.warn('[identity] Email not found in Data Cloud:', email);
          // The Agentforce agent should have already called CreateSalesContactRecord,
          // so try again after a short delay to allow SF to process
          return false;
        }
      }

      // Mark as refresh so conversation is NOT reset
      isRefreshRef.current = true;
      setCustomer(profile);
      setIsAuthenticated(true);
      // Reset refresh flag on next tick
      setTimeout(() => { isRefreshRef.current = false; }, 0);
      return true;
    } catch (err) {
      console.error('[identity] Email identification failed:', err);
      setError(err instanceof Error ? err : new Error('Email identification failed'));
      return false;
    } finally {
      setIsResolving(false);
    }
  }, []);

  /** Lightweight re-fetch: pull latest profile data (events, summaries, etc.)
   *  and merge into the current customer WITHOUT resetting the conversation. */
  const refreshProfile = useCallback(async () => {
    if (!selectedPersonaId || !customer) return;

    const isSalesforceId = /^[a-zA-Z0-9]{15,18}$/.test(selectedPersonaId) && selectedPersonaId.startsWith('003');

    if (isSalesforceId && !useMockData) {
      try {
        const dataCloudService = getDataCloudService();
        const fresh = await dataCloudService.getCustomerProfileById(selectedPersonaId);
        // Flag as refresh so ConversationContext skips session reset
        isRefreshRef.current = true;
        // Merge fresh data into existing customer — keep auth state, merkury, appended untouched
        setCustomer(prev => prev ? {
          ...prev,
          chatSummaries: fresh.chatSummaries ?? prev.chatSummaries,
          meaningfulEvents: fresh.meaningfulEvents ?? prev.meaningfulEvents,
          orders: fresh.orders ?? prev.orders,
          browseSessions: fresh.browseSessions ?? prev.browseSessions,
          agentCapturedProfile: fresh.agentCapturedProfile ?? prev.agentCapturedProfile,
          beautyProfile: fresh.beautyProfile ?? prev.beautyProfile,
          loyalty: fresh.loyalty ?? prev.loyalty,
          skinAnalyses: fresh.skinAnalyses ?? prev.skinAnalyses,
          journeyApprovals: fresh.journeyApprovals ?? prev.journeyApprovals,
        } : prev);
        // Clear flag after React processes the state update
        setTimeout(() => { isRefreshRef.current = false; }, 0);
      } catch (err) {
        console.error('[customer] Lightweight refresh failed:', err);
        isRefreshRef.current = false;
      }
    } else if (useMockData) {
      // Mock mode: just re-read persona data
      const persona = getPersonaById(selectedPersonaId);
      if (persona) {
        isRefreshRef.current = true;
        setCustomer(prev => prev ? { ...prev, ...persona.profile, id: prev.id, name: prev.name, email: prev.email } : prev);
        setTimeout(() => { isRefreshRef.current = false; }, 0);
      }
    }
  }, [selectedPersonaId, customer]);

  /** Clear a persona's cached session so their next switch re-fires welcome. */
  const resetPersonaSession = useCallback((personaId: string) => {
    for (const cb of sessionResetCallbacksRef.current) cb(personaId);
    // If resetting the active persona, re-select to trigger fresh welcome
    if (personaId === selectedPersonaId) {
      selectPersona(personaId);
    }
  }, [selectedPersonaId, selectPersona]);

  /** Register as a pre-seeded Merkury contact.
   *  In real mode, `id` is a Salesforce Contact ID.
   *  In mock mode, `id` is a merkury archetype ID from merkuryProfiles.ts. */
  const registerContact = useCallback(async (id: string) => {
    const isSalesforceId = /^[a-zA-Z0-9]{15,18}$/.test(id) && id.startsWith('003');
    if (isSalesforceId || !useMockData) {
      // Real mode — id is a Salesforce Contact ID
      await selectPersona(id);
      setIsAuthenticated(true);
    } else {
      // Mock mode — id is a merkury archetype ID
      const archetype = getMerkuryArchetypeById(id);
      if (archetype) {
        const profile: CustomerProfile = {
          id: archetype.merkuryId,
          name: archetype.label,
          email: `${archetype.id}@example.com`,
          beautyProfile: {
            skinType: (archetype.beautyHints.skinType || 'normal').toLowerCase() as CustomerProfile['beautyProfile']['skinType'],
            concerns: archetype.beautyHints.concerns || [],
            allergies: [],
            preferredBrands: archetype.beautyHints.preferredBrands || [],
          },
          orders: [],
          purchaseHistory: [],
          chatSummaries: [],
          meaningfulEvents: [],
          browseSessions: [],
          loyalty: null,
          savedPaymentMethods: [],
          shippingAddresses: [],
          recentActivity: [],
          merkuryIdentity: {
            merkuryId: archetype.merkuryId,
            identityTier: 'known',
            confidence: 0.95,
            resolvedAt: new Date().toISOString(),
          },
          appendedProfile: archetype.appendedProfile,
        };
        setSelectedPersonaId(id);
        setCustomer(profile);
        setIsAuthenticated(true);
      }
    }
  }, [selectPersona]);

  /** Create a guest contact (email signup / guest checkout).
   *  In real mode, creates a Contact in CRM via POST /api/contacts.
   *  In mock mode, creates an in-memory profile. */
  const createGuestContact = useCallback(async (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    merkuryId?: string;
  }): Promise<{ contactId: string; accountId: string } | null> => {
    if (useMockData) {
      const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email.split('@')[0];
      const profile: CustomerProfile = {
        id: `guest-${Date.now()}`,
        name,
        email: data.email,
        beautyProfile: { skinType: 'normal', concerns: [], allergies: [], preferredBrands: [] },
        orders: [],
        purchaseHistory: [],
        chatSummaries: [],
        meaningfulEvents: [],
        browseSessions: [],
        loyalty: null,
        savedPaymentMethods: [],
        shippingAddresses: [],
        recentActivity: [],
        merkuryIdentity: {
          merkuryId: data.merkuryId || `MRK-GUEST-${Date.now()}`,
          identityTier: 'known',
          confidence: 0.7,
          resolvedAt: new Date().toISOString(),
        },
      };
      if (data.merkuryId) {
        const archetype = getMerkuryArchetypeByMerkuryId(data.merkuryId);
        if (archetype) profile.appendedProfile = archetype.appendedProfile;
      }
      setCustomer(profile);
      setIsAuthenticated(true);
      return { contactId: profile.id, accountId: `acct-${Date.now()}` };
    }

    // Real mode: create Contact in CRM
    const result = await createContact({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      merkuryId: data.merkuryId,
      demoProfile: 'Created',
      leadSource: 'Web',
    });

    if (result) {
      isRefreshRef.current = true;
      await selectPersona(result.contactId);
      setIsAuthenticated(true);
      isRefreshRef.current = false;
    }

    return result;
  }, [selectPersona]);

  /** Demo-legible loyalty enrollment — flips the current customer's loyalty
   *  state on the client. Marks refreshRef so ConversationContext doesn't
   *  treat this as a persona switch and blow away the conversation. */
  const enrollInLoyalty = useCallback(() => {
    setCustomer((prev) => {
      if (!prev) return prev;
      if (prev.loyalty) return prev;
      isRefreshRef.current = true;
      return {
        ...prev,
        loyalty: {
          tier: 'bronze',
          pointsBalance: 500,
          lifetimePoints: 500,
          memberSince: new Date().toISOString().split('T')[0],
          rewardsAvailable: [],
        },
      };
    });
    // Clear the refresh flag on the next tick so legitimate persona changes
    // still fire conversation resets.
    setTimeout(() => { isRefreshRef.current = false; }, 0);
  }, []);

  return (
    <CustomerContext.Provider value={{
      customer, selectedPersonaId, isAuthenticated, isLoading, isResolving, error,
      selectPersona, signIn, signOut, identifyByEmail, registerContact, createGuestContact,
      refreshProfile, resetPersonaSession, enrollInLoyalty,
      _isRefreshRef: isRefreshRef, _onSessionReset: onSessionReset,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextValue => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};
