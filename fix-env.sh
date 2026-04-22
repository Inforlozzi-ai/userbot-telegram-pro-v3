#!/bin/bash
# =============================================================
#  fix-env.sh — Adiciona DOMAIN e ACME_EMAIL no .env existente
#  e reinicia os containers
# =============================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }

ENV_FILE="/opt/inforlozzi-saas/.env"
DOMINIO="revendabot.expressvisto.com"
EMAIL="inforlozzi@gmail.com"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "  ❌ $ENV_FILE não encontrado!"
  exit 1
fi

echo -e "\n  ${BOLD}🔧 Corrigindo .env em $ENV_FILE${NC}\n"

# Remove linhas antigas se existirem (evita duplicação)
sed -i '/^DOMAIN=/d'     "$ENV_FILE"
sed -i '/^ACME_EMAIL=/d' "$ENV_FILE"
sed -i '/^NEXT_PUBLIC_APP_URL=/d' "$ENV_FILE"

# Insere no topo do arquivo
{
  echo "DOMAIN=${DOMINIO}"
  echo "ACME_EMAIL=${EMAIL}"
  echo "NEXT_PUBLIC_APP_URL=https://${DOMINIO}"
  echo ""
  cat "$ENV_FILE"
} > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "$ENV_FILE"

chmod 600 "$ENV_FILE"

ok "DOMAIN=${DOMINIO} adicionado!"
ok "ACME_EMAIL=${EMAIL} adicionado!"
ok "NEXT_PUBLIC_APP_URL=https://${DOMINIO} atualizado!"

echo -e "\n  ${BOLD}📋 Conteúdo atual do .env (primeiras 10 linhas):${NC}"
head -10 "$ENV_FILE"

echo -e "\n  ${BOLD}🐳 Reiniciando containers...${NC}"
cd /opt/inforlozzi-saas
docker compose up -d --build

echo -e "\n  ${BOLD}📊 Status:${NC}"
docker compose ps --format "table {{.Name}}\t{{.Status}}"

echo -e "\n  ${GREEN}${BOLD}✅ Pronto! Acesse: https://${DOMINIO}${NC}\n"
