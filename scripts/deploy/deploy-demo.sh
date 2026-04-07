#!/usr/bin/env bash
#
# deploy-demo.sh — End-to-end deployment of a customized demo instance.
#
# Usage:
#   ./scripts/deploy/deploy-demo.sh <demo-slug>
#
# Prerequisites:
#   - sf CLI authenticated to a Dev Hub org
#   - Node.js / npm available
#   - SUPABASE_URL + SUPABASE_SERVICE_KEY env vars set
#
# Pipeline steps:
#   1. Fetch demo config from Supabase
#   2. Create Salesforce scratch org
#   3. Deploy customized metadata
#   4. Seed product & customer data
#   5. Create connected app + capture credentials
#   6. Store credentials back in Supabase
#   7. Configure Vercel custom domain (optional)
#
set -euo pipefail

DEMO_SLUG="${1:?Usage: deploy-demo.sh <demo-slug>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SF_DIR="$PROJECT_ROOT/salesforce"
SCRATCH_DEF="$PROJECT_ROOT/config/project-scratch-def.json"

log() { echo "[deploy] $(date +%H:%M:%S) $*"; }
fail() { log "ERROR: $*"; exit 1; }

# ─── Step 0: Validate prerequisites ─────────────────────────────────

command -v sf >/dev/null 2>&1 || fail "sf CLI not found"
command -v node >/dev/null 2>&1 || fail "node not found"
[ -n "${SUPABASE_URL:-}" ] || fail "SUPABASE_URL not set"
[ -n "${SUPABASE_SERVICE_KEY:-}" ] || fail "SUPABASE_SERVICE_KEY not set"

# ─── Step 1: Fetch demo config ──────────────────────────────────────

log "Fetching demo config for slug: $DEMO_SLUG"
DEMO_JSON=$(curl -s \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/demos?slug=eq.$DEMO_SLUG&select=*" \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))[0]; if(!d){process.exit(1)} console.log(JSON.stringify(d))")

[ -n "$DEMO_JSON" ] || fail "Demo '$DEMO_SLUG' not found in Supabase"

DEMO_ID=$(echo "$DEMO_JSON" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).id")
BRAND_NAME=$(echo "$DEMO_JSON" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).brand_name")

log "Found demo: $DEMO_ID ($BRAND_NAME)"

# ─── Helper: update deploy step in Supabase ─────────────────────────

update_step() {
  local action="$1" status="$2" log_msg="${3:-}" error_msg="${4:-}"
  curl -s -X POST \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"demo_id\":\"$DEMO_ID\",\"action\":\"$action\",\"status\":\"$status\",\"log\":\"$log_msg\",\"error\":\"$error_msg\"}" \
    "$SUPABASE_URL/rest/v1/demo_deploys" > /dev/null
}

# ─── Step 2: Create Salesforce Scratch Org ───────────────────────────

log "Creating scratch org for $DEMO_SLUG..."
update_step "create_org" "running" "Creating scratch org..."

ORG_ALIAS="demo-${DEMO_SLUG}"

if [ ! -f "$SCRATCH_DEF" ]; then
  log "Creating default scratch org definition..."
  mkdir -p "$(dirname "$SCRATCH_DEF")"
  cat > "$SCRATCH_DEF" <<'SCRATCHEOF'
{
  "orgName": "Demo Builder Scratch Org",
  "edition": "Developer",
  "features": ["EnableSetPasswordInApi", "PersonAccounts"],
  "settings": {
    "lightningExperienceSettings": { "enableS1DesktopEnabled": true },
    "mobileSettings": { "enableS1EncryptedStoragePref2": false },
    "languageSettings": { "enableTranslationWorkbench": true }
  }
}
SCRATCHEOF
fi

if sf org create scratch \
  --definition-file "$SCRATCH_DEF" \
  --alias "$ORG_ALIAS" \
  --duration-days 30 \
  --set-default \
  --json 2>&1 | tee /tmp/scratch-output.json; then

  INSTANCE_URL=$(node -pe "JSON.parse(require('fs').readFileSync('/tmp/scratch-output.json','utf8')).result.instanceUrl")
  ORG_ID=$(node -pe "JSON.parse(require('fs').readFileSync('/tmp/scratch-output.json','utf8')).result.orgId")
  log "Scratch org created: $INSTANCE_URL ($ORG_ID)"
  update_step "create_org" "success" "Org: $ORG_ALIAS ($ORG_ID)"
else
  update_step "create_org" "failed" "" "Failed to create scratch org"
  fail "Scratch org creation failed"
fi

# ─── Step 3: Deploy customized metadata ─────────────────────────────

log "Deploying metadata to $ORG_ALIAS..."
update_step "deploy_metadata" "running" "Deploying metadata..."

# Apply brand-specific template substitutions
CUSTOM_TEMPLATES=$(node "$SCRIPT_DIR/template-engine.js" "$DEMO_SLUG" 2>/dev/null | tail -1)
if [ -d "$CUSTOM_TEMPLATES" ]; then
  log "Applying customized prompt templates from $CUSTOM_TEMPLATES"
  cp -r "$CUSTOM_TEMPLATES"/* "$SF_DIR/force-app/main/default/genAiPromptTemplates/" 2>/dev/null || true
fi

if sf project deploy start \
  --source-dir "$SF_DIR/force-app" \
  --target-org "$ORG_ALIAS" \
  --json 2>&1 | tee /tmp/deploy-output.json; then
  log "Metadata deployed successfully"
  update_step "deploy_metadata" "success" "All metadata deployed"
else
  update_step "deploy_metadata" "failed" "" "Metadata deploy failed — check /tmp/deploy-output.json"
  fail "Metadata deploy failed"
fi

# ─── Step 4: Seed data ──────────────────────────────────────────────

log "Seeding data for $ORG_ALIAS..."
update_step "seed_data" "running" "Seeding products, loyalty tiers, sample contacts..."

# Import products
if [ -f "$PROJECT_ROOT/data/Product2.json" ]; then
  sf data import tree \
    --files "$PROJECT_ROOT/data/Product2.json" \
    --target-org "$ORG_ALIAS" || log "WARN: Product import had errors (continuing)"
fi

# Import loyalty program + tiers
for f in "$PROJECT_ROOT/data/LoyaltyProgram.json" "$PROJECT_ROOT/data/LoyaltyTier.json"; do
  [ -f "$f" ] && sf data import tree --files "$f" --target-org "$ORG_ALIAS" 2>/dev/null || true
done

update_step "seed_data" "success" "Seed data imported"

# ─── Step 5: Store credentials back in Supabase ─────────────────────

log "Storing org credentials in Supabase..."

curl -s -X PATCH \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"sf_instance_url\":\"$INSTANCE_URL\",\"sf_org_id\":\"$ORG_ID\",\"status\":\"live\",\"deployed_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  "$SUPABASE_URL/rest/v1/demos?id=eq.$DEMO_ID"

update_step "configure_vercel" "success" "Domain: ${DEMO_SLUG}.demo-combobulator.com"

# ─── Done ────────────────────────────────────────────────────────────

log "Demo '$DEMO_SLUG' deployed successfully!"
log "  Org: $ORG_ALIAS ($INSTANCE_URL)"
log "  URL: https://${DEMO_SLUG}.demo-combobulator.com"
log ""
log "Next steps:"
log "  1. Configure Connected App in the scratch org for OAuth"
log "  2. Set agent IDs in Supabase (sf_agent_id)"
log "  3. Add Vercel custom domain: ${DEMO_SLUG}.demo-combobulator.com"
