import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useCampaign } from '@/contexts/CampaignContext';
import { getBrowseTracker } from '@/services/datacloud/browseTracker';
import { setPersonalizationCampaign } from '@/services/personalization';
import { pushUtmToDataLayer } from '@/services/merkury/dataLayer';
import { demoLog } from '@/services/demoLog';
import { CAMPAIGN_DATA } from '@/mocks/campaigns';

/**
 * Side-effect-only hook that bridges React state to the BrowseSessionTracker singleton.
 * Tracks product views, category navigation, and campaign attribution for the current customer.
 * Mount once in StorefrontPage — produces no re-renders.
 */
export function useBrowseTracking() {
  const { view, selectedProduct, selectedCategory } = useStore();
  const { customer } = useCustomer();
  const { campaign, setCampaignFromUtm } = useCampaign();
  const tracker = getBrowseTracker();
  const location = useLocation();

  // Parse UTM params from URL search string
  const urlUtmParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    if (utmSource && utmMedium && utmCampaign) {
      return { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign };
    }
    return null;
  }, [location.search]);

  // Sync customer identity — flushes old session on persona switch
  useEffect(() => {
    tracker.setCustomer(customer?.id ?? null);
  }, [customer?.id, tracker]);

  // Effect to set campaign from URL UTM params
  useEffect(() => {
    if (urlUtmParams) {
      // Find the campaign that matches the UTM parameters
      const matched = CAMPAIGN_DATA.find(c =>
        c.adCreative.utmParams.utm_source === urlUtmParams.utm_source &&
        c.adCreative.utmParams.utm_medium === urlUtmParams.utm_medium &&
        c.adCreative.utmParams.utm_campaign === urlUtmParams.utm_campaign
      );
      if (matched) {
        setCampaignFromUtm(matched);
      }
    }
  }, [urlUtmParams, setCampaignFromUtm]);

  // Sync campaign attribution — persisted with browse sessions for server-side decode
  // AND pushed to SF Personalization as context variables for same-session targeting.
  // This is also where UTM params get logged to the DemoLog — it fires inside
  // StorefrontPage's useEffect (AFTER DemoLog is mounted and polling).
  const utmLoggedRef = useRef(false);
  useEffect(() => {
    if (campaign) {
      const { utm_campaign, utm_source, utm_medium } = campaign.adCreative.utmParams;
      tracker.setCampaign(utm_campaign, utm_source, utm_medium);
      setPersonalizationCampaign(utm_campaign, utm_source, utm_medium);
      pushUtmToDataLayer(utm_campaign, utm_source, utm_medium);

      // Log to DemoLog (only once per session to avoid duplicates on re-renders)
      if (!utmLoggedRef.current) {
        utmLoggedRef.current = true;
        demoLog.log({
          category: 'campaign',
          title: 'UTM Parameters Captured',
          subtitle: `${utm_source} / ${utm_medium} / ${utm_campaign}`,
          details: { ...campaign.adCreative.utmParams },
        });
        demoLog.log({
          category: 'campaign',
          title: 'Campaign Attribution Resolved',
          subtitle: campaign.adCreative.campaignName,
          details: {
            platform: campaign.adCreative.platform,
            audience: campaign.adCreative.audienceSegment.segmentName,
            strategy: campaign.adCreative.targetingStrategy,
          },
        });
      }
    } else {
      tracker.setCampaign(null, null, null);
      setPersonalizationCampaign(null, null, null);
      pushUtmToDataLayer();
    }
  }, [campaign, tracker]);

  // Track product views
  useEffect(() => {
    if (view === 'product' && selectedProduct) {
      tracker.trackProductView(selectedProduct.id, selectedProduct.category);
    }
  }, [view, selectedProduct, tracker]);

  // Track category views
  useEffect(() => {
    if (view === 'category' && selectedCategory) {
      tracker.trackCategoryView(selectedCategory);
    }
  }, [view, selectedCategory, tracker]);

  // Flush on unmount (e.g. switching to advisor mode)
  useEffect(() => {
    return () => { tracker.flush(); };
  }, [tracker]);
}
