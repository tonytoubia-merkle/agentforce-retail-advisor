/**
 * /api/demo-deploy — Triggers the deploy pipeline for a demo.
 *
 * POST /api/demo-deploy
 * Body: { demoId: string, actions?: string[] }
 *
 * In Phase 1, this updates deploy step records in Supabase.
 * In Phase 3, this will spawn the actual shell deploy script
 * or call Salesforce APIs directly.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const DEPLOY_STEPS = [
  { action: 'create_org', label: 'Provision Salesforce Scratch Org' },
  { action: 'deploy_metadata', label: 'Deploy Customized Metadata' },
  { action: 'seed_data', label: 'Seed Product & Customer Data' },
  { action: 'configure_vercel', label: 'Configure Vercel Domain' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { demoId, actions } = req.body || {};
  if (!demoId) {
    return res.status(400).json({ error: 'demoId is required' });
  }

  try {
    // Verify the demo exists
    const { data: demo, error: demoErr } = await supabase
      .from('demos')
      .select('id, slug, status, brand_name')
      .eq('id', demoId)
      .single();

    if (demoErr || !demo) {
      return res.status(404).json({ error: 'Demo not found' });
    }

    // Update demo status to deploying
    await supabase
      .from('demos')
      .update({ status: 'deploying' })
      .eq('id', demoId);

    // Create deploy step records
    const stepsToRun = actions
      ? DEPLOY_STEPS.filter((s) => actions.includes(s.action))
      : DEPLOY_STEPS;

    const stepRecords = stepsToRun.map((s) => ({
      demo_id: demoId,
      action: s.action,
      status: 'pending',
    }));

    await supabase.from('demo_deploys').insert(stepRecords);

    // ── Execute deploy steps sequentially ──────────────────────────
    for (const step of stepsToRun) {
      // Mark step as running
      await supabase
        .from('demo_deploys')
        .update({ status: 'running' })
        .eq('demo_id', demoId)
        .eq('action', step.action)
        .eq('status', 'pending');

      try {
        const result = await executeStep(step.action, demo);

        await supabase
          .from('demo_deploys')
          .update({
            status: 'success',
            log: result.log,
            completed_at: new Date().toISOString(),
          })
          .eq('demo_id', demoId)
          .eq('action', step.action);
      } catch (stepErr) {
        await supabase
          .from('demo_deploys')
          .update({
            status: 'failed',
            error: stepErr.message,
            completed_at: new Date().toISOString(),
          })
          .eq('demo_id', demoId)
          .eq('action', step.action);

        // Mark demo as error and stop
        await supabase
          .from('demos')
          .update({ status: 'error' })
          .eq('id', demoId);

        return res.status(500).json({
          error: `Deploy failed at step: ${step.action}`,
          detail: stepErr.message,
        });
      }
    }

    // Mark demo as live
    await supabase
      .from('demos')
      .update({ status: 'live', deployed_at: new Date().toISOString() })
      .eq('id', demoId);

    return res.status(200).json({ success: true, slug: demo.slug });
  } catch (err) {
    console.error('[demo-deploy] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ── Step executors (Phase 3 will add real implementations) ──────────

async function executeStep(action, demo) {
  switch (action) {
    case 'create_org':
      return await stepCreateOrg(demo);
    case 'deploy_metadata':
      return await stepDeployMetadata(demo);
    case 'seed_data':
      return await stepSeedData(demo);
    case 'configure_vercel':
      return await stepConfigureVercel(demo);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function stepCreateOrg(demo) {
  // Phase 3: Call sf CLI or Salesforce REST API to create scratch org
  // For now, simulate with a delay and log
  const log = [
    `[create_org] Would create scratch org for ${demo.slug}`,
    `[create_org] Org alias: demo-${demo.slug}`,
    `[create_org] Duration: 30 days`,
    `[create_org] TODO: Implement sf org create scratch`,
  ].join('\n');
  return { log };
}

async function stepDeployMetadata(demo) {
  const log = [
    `[deploy_metadata] Would deploy salesforce/force-app to demo-${demo.slug}`,
    `[deploy_metadata] Brand: ${demo.brand_name}`,
    `[deploy_metadata] TODO: Apply prompt template substitutions`,
    `[deploy_metadata] TODO: Implement sf project deploy start`,
  ].join('\n');
  return { log };
}

async function stepSeedData(demo) {
  // Phase 3: Load demo_products from Supabase, convert to Product2 records, bulk insert
  const { data: products } = await supabase
    .from('demo_products')
    .select('id')
    .eq('demo_id', demo.id);

  const log = [
    `[seed_data] Found ${products?.length || 0} products to seed`,
    `[seed_data] TODO: Convert to Product2 + bulk import via sf data import`,
    `[seed_data] TODO: Seed LoyaltyProgram, LoyaltyTier, sample Contacts`,
  ].join('\n');
  return { log };
}

async function stepConfigureVercel(demo) {
  // Phase 3: Use Vercel API to add custom domain
  const log = [
    `[configure_vercel] Domain: ${demo.slug}.demo-combobulator.com`,
    `[configure_vercel] TODO: Call Vercel API to add domain alias`,
    `[configure_vercel] TODO: Configure demo-specific env vars`,
  ].join('\n');
  return { log };
}
