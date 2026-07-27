#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Starting Plesk deployment..."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed or not available in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or not available in PATH."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Creating runtime config and preparing database..."
npx tsx server/setup.ts --write-config

echo "Building application..."
npm run build

echo "Deployment files are ready."
echo "If Plesk does not auto-restart the app, use the Restart button once."
