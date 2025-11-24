#!/bin/sh
set -e

# Fonction pour arrêter proprement les processus
cleanup() {
  echo "Arrêt en cours..."
  kill $BUN_PID 2>/dev/null || true
  apache2ctl stop
  exit 0
}

# Capturer les signaux pour un arrêt propre
trap 'cleanup' TERM INT

# Démarrer le serveur Node.js en arrière-plan
cd /app
bun run --bun server/index.ts &
BUN_PID=$!

# Attendre que le serveur soit prêt (vérification avec curl)
echo "Attente du démarrage du serveur Node.js..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f -s http://127.0.0.1:3001/api/auth/status >/dev/null 2>&1; then
    echo "Serveur Node.js prêt"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Avertissement: Le serveur Node.js n'a pas répondu dans les temps, mais on continue..." >&2
fi

# Démarrer Apache en premier plan
exec apache2ctl -D FOREGROUND

