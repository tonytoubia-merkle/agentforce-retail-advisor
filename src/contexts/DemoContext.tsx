/**
 * DemoContext — runtime configuration for multi-tenant demo instances.
 *
 * At startup, reads the current subdomain (or ?demo= query param for local dev),
 * fetches the matching DemoConfig from Supabase, and injects:
 *   - Brand identity (name, logo, tagline)
 *   - Theme CSS custom properties
 *   - Feature flags
 *   - Salesforce org connection details
 *
 * If no demo slug is resolved (e.g. running on localhost without ?demo=),
 * falls back to the "default" golden-template config so the original
 * beauty demo continues to work unchanged.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type { DemoConfig, DemoTheme } from '@/types/demo';
import { getDemo } from '@/services/supabase/demoService';
import { getVerticalCopy, type VerticalCopy } from '@/config/verticalCopy';

// ─── Default config (golden template — original beauty demo) ────────
const DEFAULT_CONFIG: DemoConfig = {
  id: 'default',
  slug: 'default',
  name: 'Beauty Advisor Demo',
  vertical: 'beauty',
  status: 'live',
  ownerEmail: '',
  brandName: 'SERENE',
  brandTagline: 'Your Personal Beauty Advisor',
  theme: {
    primaryColor: '#1a1a2e',
    accentColor: '#e94560',
    backgroundColor: '#0f0f23',
    textColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  salesforce: {
    instanceUrl: import.meta.env.VITE_AGENTFORCE_INSTANCE_URL as string,
    agentId: import.meta.env.VITE_AGENTFORCE_AGENT_ID as string,
    skinAgentId: import.meta.env.VITE_SKIN_ADVISOR_AGENT_ID as string,
  },
  imageProvider: (import.meta.env.VITE_IMAGE_PROVIDER as DemoConfig['imageProvider']) || 'none',
  featureFlags: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableGenerativeBackgrounds: import.meta.env.VITE_ENABLE_GENERATIVE_BACKGROUNDS === 'true',
    enableProductTransparency: import.meta.env.VITE_ENABLE_PRODUCT_TRANSPARENCY !== 'false',
    enableSkinAdvisor: !!import.meta.env.VITE_SKIN_ADVISOR_AGENT_ID,
  },
  createdAt: '',
  updatedAt: '',
};

// ─── Context ────────────────────────────────────────────────────────

interface DemoContextValue {
  config: DemoConfig;
  copy: VerticalCopy;       // vertical-specific copy (advisor name, CTAs, etc.)
  isLoading: boolean;
  isAdmin: boolean;         // true when on admin.* subdomain or /admin route
  isDefault: boolean;       // true when using golden template (no custom demo)
  error: string | null;
}

const DemoCtx = createContext<DemoContextValue>({
  config: DEFAULT_CONFIG,
  copy: getVerticalCopy(DEFAULT_CONFIG),
  isLoading: false,
  isAdmin: false,
  isDefault: true,
  error: null,
});

export const useDemo = () => useContext(DemoCtx);

// ─── Singleton accessor (for module-scope / non-hook code) ──────────
// Updated by the DemoProvider when config changes.
let _currentConfig: DemoConfig = DEFAULT_CONFIG;

/** Read the current demo config outside of React (services, module-scope constants). */
export function getDemoConfig(): DemoConfig {
  return _currentConfig;
}

// ─── Slug resolver ──────────────────────────────────────────────────

function resolveSlug(): { slug: string | null; isAdmin: boolean } {
  // 1. Query param override (local dev): ?demo=gucci-us
  const params = new URLSearchParams(window.location.search);
  const qsDemo = params.get('demo');
  if (qsDemo) return { slug: qsDemo, isAdmin: false };

  // 2. Check if admin subdomain
  const host = window.location.hostname;
  if (host.startsWith('admin.') || window.location.pathname.startsWith('/admin')) {
    return { slug: null, isAdmin: true };
  }

  // 3. Subdomain: {slug}.demo-combobulator.com
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return { slug: parts[0], isAdmin: false };
  }

  // 4. Localhost / no subdomain → default
  return { slug: null, isAdmin: false };
}

// ─── Theme injector ─────────────────────────────────────────────────

function applyTheme(theme: DemoTheme) {
  const root = document.documentElement;
  root.style.setProperty('--demo-primary', theme.primaryColor);
  root.style.setProperty('--demo-accent', theme.accentColor);
  root.style.setProperty('--demo-bg', theme.backgroundColor);
  root.style.setProperty('--demo-text', theme.textColor);
  root.style.setProperty('--demo-font', theme.fontFamily);
}

function applyBrandDocumentMeta(config: DemoConfig, copy: VerticalCopy) {
  // Page title
  document.title = `${config.brandName} — ${config.brandTagline || copy.advisorSubtitle}`;

  // Favicon
  if (config.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.faviconUrl;
  }
}

// ─── Provider ───────────────────────────────────────────────────────

export function DemoProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { slug, isAdmin } = useMemo(resolveSlug, []);

  useEffect(() => {
    // If no slug (default or admin), use DEFAULT_CONFIG — legacy beauty demo behavior
    if (!slug) {
      applyTheme(DEFAULT_CONFIG.theme);
      applyBrandDocumentMeta(DEFAULT_CONFIG, getVerticalCopy(DEFAULT_CONFIG));
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const demo = await getDemo(slug);
        if (cancelled) return;
        if (demo) {
          setConfig(demo);
          applyTheme(demo.theme);
          applyBrandDocumentMeta(demo, getVerticalCopy(demo));
        } else {
          setError(`Demo "${slug}" not found`);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load demo config:', err);
          setError(err instanceof Error ? err.message : 'Failed to load demo');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Keep singleton in sync for non-hook consumers
  useEffect(() => { _currentConfig = config; }, [config]);

  const value = useMemo<DemoContextValue>(() => ({
    config,
    copy: getVerticalCopy(config),
    isLoading,
    isAdmin,
    isDefault: config.id === 'default',
    error,
  }), [config, isLoading, isAdmin, error]);

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}
