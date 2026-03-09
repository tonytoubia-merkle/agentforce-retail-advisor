#!/usr/bin/env bash
# deploy-fields-and-permissions.sh
#
# Deploys Contact custom fields, custom objects, and the
# Agent Custom Object Access permission set to the target org.
#
# Prerequisites:
#   - Salesforce CLI (sf) installed
#   - Authenticated to target org (sf org login web -a <alias>)
#
# Usage:
#   ./salesforce/scripts/deploy-fields-and-permissions.sh [org-alias]

set -euo pipefail

ORG="${1:-}"
ORG_FLAG=""
if [ -n "$ORG" ]; then
  ORG_FLAG="--target-org $ORG"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SF_DIR="$ROOT_DIR/salesforce/force-app/main/default"

echo "=== Step 1: Deploy Contact custom fields ==="
sf project deploy start \
  --source-dir "$SF_DIR/objects/Contact" \
  $ORG_FLAG \
  --wait 10

echo ""
echo "=== Step 2: Deploy custom objects (with all fields) ==="
for obj in Meaningful_Event__c Chat_Summary__c Agent_Captured_Profile__c Browse_Session__c Scene_Asset__c; do
  echo "  Deploying $obj..."
  sf project deploy start \
    --source-dir "$SF_DIR/objects/$obj" \
    $ORG_FLAG \
    --wait 10
done

echo ""
echo "=== Step 3: Deploy Agent Custom Object Access permission set ==="
sf project deploy start \
  --source-dir "$SF_DIR/permissionsets" \
  $ORG_FLAG \
  --wait 10

echo ""
echo "=== Step 4: Assign permission set to current user ==="
sf org assign permset \
  --name Agent_Custom_Object_Access \
  $ORG_FLAG \
  2>/dev/null && echo "  Assigned to current user." || echo "  (Already assigned or not applicable)"

echo ""
echo "=== Done ==="
echo ""
echo "MANUAL STEP: Assign the 'Agent Custom Object Access' permission set"
echo "to the EinsteinServiceAgent User (beauty_concierge@...) in Setup if"
echo "you haven't already."
