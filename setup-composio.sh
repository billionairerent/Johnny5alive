#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${COMPOSIO_USER_API_KEY:-}" ]]; then
  echo "error: COMPOSIO_USER_API_KEY must be set" >&2
  exit 1
fi

COMPOSIO_ORG="${COMPOSIO_ORG:-rent.billionaire_workspace}"

curl -fsSL https://composio.dev/install | bash

export PATH="$HOME/.composio/bin:$PATH"

composio login \
  --user-api-key "$COMPOSIO_USER_API_KEY" \
  --org "$COMPOSIO_ORG"
