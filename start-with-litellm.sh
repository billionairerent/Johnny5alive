#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
MIROSHARK_DIR="$REPO_DIR/miroshark"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    echo "ERROR: ANTHROPIC_API_KEY is not set."
    echo "Export it first:  export ANTHROPIC_API_KEY=sk-ant-..."
    exit 1
fi

echo "[*] Starting LiteLLM proxy on port 4000..."
cd "$MIROSHARK_DIR/backend"
uv run --with litellm litellm \
    --config "$REPO_DIR/litellm_config.yaml" \
    --port 4000 --host 127.0.0.1 \
    > "$MIROSHARK_DIR/.litellm.log" 2>&1 &
LITELLM_PID=$!
echo "[+] LiteLLM PID: $LITELLM_PID"

echo "[*] Waiting for LiteLLM to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:4000/health >/dev/null 2>&1; then
        echo "[+] LiteLLM ready"
        break
    fi
    sleep 1
done

echo "[*] Starting MiroShark..."
exec "$MIROSHARK_DIR/miroshark" start
