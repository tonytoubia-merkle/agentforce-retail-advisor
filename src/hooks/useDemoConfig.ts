/**
 * useDemoConfig — convenience hooks that bridge DemoContext into
 * the runtime app, replacing direct import.meta.env reads.
 *
 * Components that previously read VITE_USE_MOCK_DATA, VITE_IMAGE_PROVIDER,
 * VITE_ENABLE_*, or VITE_AGENTFORCE_* should switch to these hooks so
 * multi-tenant demos get the correct per-demo values.
 */
import { useDemo } from '@/contexts/DemoContext';
import type { ImageProvider } from '@/types/demo';

/** Feature flag shorthand */
export function useDemoFlags() {
  const { config } = useDemo();
  return config.featureFlags;
}

/** Whether mock data should be used (no real SF org connected) */
export function useUseMockData(): boolean {
  const { config } = useDemo();
  return config.featureFlags.useMockData;
}

/** Current image provider for this demo */
export function useImageProvider(): ImageProvider {
  const { config } = useDemo();
  return config.imageProvider;
}

/** Salesforce org config for this demo */
export function useSalesforceConfig() {
  const { config } = useDemo();
  return config.salesforce;
}

/** Brand identity for this demo */
export function useBrand() {
  const { config } = useDemo();
  return {
    name: config.brandName,
    tagline: config.brandTagline,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    vertical: config.vertical,
  };
}

/** Demo theme (also injected as CSS vars, but available as JS values) */
export function useDemoTheme() {
  const { config } = useDemo();
  return config.theme;
}
