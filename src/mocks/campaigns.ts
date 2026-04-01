import type { CampaignAttribution } from '@/types/campaign';
import { AD_CREATIVES } from './adCreatives';

export const CAMPAIGN_DATA: CampaignAttribution[] = AD_CREATIVES.map((adCreative) => ({
  adCreative,
  entrySource: 'media-wall' as const,
  clickedAt: new Date().toISOString(),
}));
