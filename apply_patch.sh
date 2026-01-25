#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "${TARGET}" ]]; then
  echo "Uso: $0 /ruta/al/repo/chatwoot"
  exit 1
fi

if [[ ! -d "${TARGET}/app" ]]; then
  echo "No encuentro ${TARGET}/app. Pasá la ruta del repo Chatwoot."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Aplicando patch desde: ${ROOT}/patch"
echo "Hacia: ${TARGET}"

# Copiar archivos Rails
rsync -av --delete "${ROOT}/patch/" "${TARGET}/"

echo
echo "✅ Patch copiado."
echo "👉 Ahora pegá el snippet de routes en: ${TARGET}/config/routes.rb"
echo "   Ver: ${ROOT}/docs/routes_snippet.rb"
