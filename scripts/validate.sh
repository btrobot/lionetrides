#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "🔍 Running validate..."
pnpm validate

echo ""
echo "🔍 Checking i18n consistency..."
npx tsx scripts/validate-i18n.ts
echo "✅ i18n check passed!"
