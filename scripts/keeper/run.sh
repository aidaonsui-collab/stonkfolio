#!/usr/bin/env bash
# Jessica's Air keeper tick. Same Eve Circle Agent Wallet. No new keys.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"
cd "$ROOT"
mkdir -p data
if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi
export INDEXER_WORKER="${INDEXER_WORKER:-jessica:$(scutil --get LocalHostName 2>/dev/null || hostname)}"
exec node scripts/keeper/tick.mjs
