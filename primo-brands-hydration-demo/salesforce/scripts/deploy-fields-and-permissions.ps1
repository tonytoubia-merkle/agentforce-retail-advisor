# deploy-fields-and-permissions.ps1
#
# Deploys Contact custom fields, custom objects, and the
# Agent Custom Object Access permission set to the target org.
#
# Usage:
#   .\salesforce\scripts\deploy-fields-and-permissions.ps1 -Org my-org

param(
    [Parameter(Mandatory=$true)]
    [string]$Org
)

$ErrorActionPreference = "Continue"

$SfDir = Join-Path $PSScriptRoot "..\force-app\main\default"
$SfDir = Resolve-Path $SfDir

Write-Host "=== Step 1: Deploy Contact custom fields ===" -ForegroundColor Cyan
sf project deploy start --source-dir "$SfDir\objects\Contact" --target-org $Org --wait 10

Write-Host ""
Write-Host "=== Step 2: Deploy custom objects ===" -ForegroundColor Cyan
$objects = @("Meaningful_Event__c", "Chat_Summary__c", "Agent_Captured_Profile__c", "Browse_Session__c", "Scene_Asset__c")
foreach ($obj in $objects) {
    Write-Host "  Deploying $obj..."
    sf project deploy start --source-dir "$SfDir\objects\$obj" --target-org $Org --wait 10
}

Write-Host ""
Write-Host "=== Step 3: Deploy permission set ===" -ForegroundColor Cyan
sf project deploy start --source-dir "$SfDir\permissionsets" --target-org $Org --wait 10

Write-Host ""
Write-Host "=== Step 4: Assign permission set to current user ===" -ForegroundColor Cyan
sf org assign permset --name Agent_Custom_Object_Access --target-org $Org
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Assigned to current user."
} else {
    Write-Host "  (Already assigned or not applicable)"
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host ""
Write-Host "MANUAL STEP: Assign 'Agent Custom Object Access' permission set"
Write-Host "to the EinsteinServiceAgent User (beauty_concierge@...) in Setup."
