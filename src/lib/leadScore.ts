/**
 * Merkury Lead Score — derived from everything the storefront already knows
 * about the visitor. Intentionally demo-legible: each input contributes a
 * named band (tier, loyalty, purchase depth, browse depth, cart intent,
 * appended signals) so the tooltip can show the reader *why* they scored
 * where they did.
 *
 * Scale: 0–100. Bands: 0–39 cold, 40–59 warm, 60–79 qualified, 80–100 high-intent.
 */
import type { CustomerProfile } from '@/types/customer';

export interface LeadScoreBreakdown {
  /** Total score, clamped 0–100. */
  score: number;
  /** Band label — "cold", "warm", "qualified", "high-intent". */
  band: 'cold' | 'warm' | 'qualified' | 'high-intent';
  /** Individual contributors shown in the tooltip. */
  contributors: Array<{ label: string; delta: number }>;
}

export interface LeadScoreInputs {
  customer: CustomerProfile | null | undefined;
  isAuthenticated: boolean;
  cartSubtotal: number;
  cartItemCount: number;
}

function band(score: number): LeadScoreBreakdown['band'] {
  if (score >= 80) return 'high-intent';
  if (score >= 60) return 'qualified';
  if (score >= 40) return 'warm';
  return 'cold';
}

export function computeLeadScore(input: LeadScoreInputs): LeadScoreBreakdown {
  const contributors: Array<{ label: string; delta: number }> = [];
  const add = (label: string, delta: number) => {
    if (delta !== 0) contributors.push({ label, delta });
  };

  const tier = input.customer?.merkuryIdentity?.identityTier;
  if (tier === 'known') add('Known customer (Merkury)', 40);
  else if (tier === 'appended') add('Appended profile (3P match)', 25);
  else add('Anonymous visitor', 5);

  if (input.isAuthenticated) add('Signed in', 10);

  const loyaltyTier = input.customer?.loyalty?.tier;
  if (loyaltyTier) {
    const loyaltyDelta =
      loyaltyTier === 'platinum' || loyaltyTier === 'gold' ? 15 :
      loyaltyTier === 'silver' ? 10 : 6;
    add(`Loyalty · ${loyaltyTier}`, loyaltyDelta);
  }

  const orderCount = input.customer?.orders?.length ?? 0;
  if (orderCount >= 5) add('Repeat purchaser (5+)', 15);
  else if (orderCount >= 2) add('Repeat purchaser', 8);
  else if (orderCount === 1) add('Prior purchase', 4);

  const browseSessions = input.customer?.browseSessions?.length ?? 0;
  if (browseSessions >= 3) add('Engaged browser', 5);

  const appendedInterests = input.customer?.appendedProfile?.interests?.length ?? 0;
  if (appendedInterests >= 3) add('Rich appended signals', 6);

  if (input.cartSubtotal >= 150) add('High-value cart', 12);
  else if (input.cartSubtotal >= 50) add('Active cart', 6);
  else if (input.cartItemCount > 0) add('Items in cart', 3);

  const meaningfulEvents = input.customer?.meaningfulEvents?.length ?? 0;
  if (meaningfulEvents >= 1) add('Life-event context', 5);

  const raw = contributors.reduce((s, c) => s + c.delta, 0);
  const score = Math.max(0, Math.min(100, raw));
  return { score, band: band(score), contributors };
}

/** Short color suggestion for UI rendering — band-level, not per-point. */
export function leadScoreColor(b: LeadScoreBreakdown['band']): string {
  switch (b) {
    case 'high-intent': return '#10b981'; // emerald
    case 'qualified':   return '#3b82f6'; // blue
    case 'warm':        return '#f59e0b'; // amber
    case 'cold':        return '#94a3b8'; // slate
  }
}
