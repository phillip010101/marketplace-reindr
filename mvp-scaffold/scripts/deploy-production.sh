#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-reind2546}"
REPO_DIR="${REPO_DIR:-/home/reindr.org/apps/marketplace-reindr}"
APP_DIR="${APP_DIR:-$REPO_DIR/mvp-scaffold}"
NODE_BIN_PATH="${NODE_BIN_PATH:-/opt/node-v22/bin:/opt/node-v22/node_modules/.bin:/usr/bin:/bin}"
API_SERVICE="${API_SERVICE:-reindr-marketplace-api.service}"
WEB_SERVICE="${WEB_SERVICE:-reindr-marketplace-web.service}"

run_as_app_user() {
  local cmd="$1"
  if [[ "$(id -u)" -eq 0 ]]; then
    sudo -u "$APP_USER" bash -lc "export PATH=$NODE_BIN_PATH; $cmd"
  else
    bash -lc "export PATH=$NODE_BIN_PATH; $cmd"
  fi
}

wait_for_url() {
  local url="$1"
  local attempts="${2:-30}"
  local sleep_seconds="${3:-1}"
  local i=1

  while (( i <= attempts )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
    ((i++))
  done

  return 1
}

echo "[deploy] Updating repository..."
run_as_app_user "git -C \"$REPO_DIR\" pull --ff-only"

echo "[deploy] Installing dependencies..."
run_as_app_user "cd \"$APP_DIR\" && CI=1 CONTRACT_RAG_ENSURE_MODE=baseline pnpm install"

echo "[deploy] Building web app..."
run_as_app_user "cd \"$APP_DIR\" && pnpm --filter @reindr/web build"

echo "[deploy] Restarting services..."
if [[ "$(id -u)" -eq 0 ]]; then
  systemctl restart "$API_SERVICE" "$WEB_SERVICE"
else
  sudo systemctl restart "$API_SERVICE" "$WEB_SERVICE"
fi

echo "[deploy] Health checks..."
wait_for_url "http://127.0.0.1:8787/api/providers" 45 1
wait_for_url "http://127.0.0.1:4321" 45 1

echo "[deploy] Done."
