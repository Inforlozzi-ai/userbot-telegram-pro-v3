#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  UserBot Telegram Pro v3 — Script de Instalação Automática
#  Uso: bash <(curl -fsSL https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main/install.sh)
# ═══════════════════════════════════════════════════════════════════

set -e

# ── Cores ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}\n"; }

# ── Banner ───────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${CYAN}"
cat << 'EOF'
  _   _               ____        _   
 | | | |___  ___ _ _| __ )  ___ | |_ 
 | | | / __|/ _ \ '__|  _ \ / _ \| __|
 | |_| \__ \  __/ |  | |_) | (_) | |_ 
  \___/|___/\___|_|  |____/ \___/ \__|

  Telegram Pro v3 — SaaS Installer
EOF
echo -e "${NC}"
echo -e "${YELLOW}  Instalação completa: API + Web + Docker + Traefik${NC}\n"

# ── Verificar root ───────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  err "Execute como root: sudo bash install.sh"
fi

# ── Verificar OS ─────────────────────────────────────────────────────
if ! grep -qi ubuntu /etc/os-release 2>/dev/null; then
  warn "Sistema não é Ubuntu. Continuando mesmo assim..."
fi

# ═══════════════════════════════════════════════════════════════════
step "1/8 — Coletando informações"
# ═══════════════════════════════════════════════════════════════════

read -rp "$(echo -e ${BOLD})Domínio do painel (ex: painel.seusite.com): $(echo -e ${NC})" DOMAIN
[ -z "$DOMAIN" ] && err "Domínio obrigatório."
DOMAIN="${DOMAIN%.}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%%/*}"
if [[ ! "$DOMAIN" =~ ^([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$ ]]; then
  err "Domínio inválido: '$DOMAIN'. Informe apenas o domínio, sem https://, barras ou ponto final."
fi

read -rp "$(echo -e ${BOLD})E-mail para Let's Encrypt (HTTPS): $(echo -e ${NC})" LETSENCRYPT_EMAIL
[ -z "$LETSENCRYPT_EMAIL" ] && err "E-mail obrigatório."
if [[ ! "$LETSENCRYPT_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  err "E-mail inválido: '$LETSENCRYPT_EMAIL'."
fi

read -rp "$(echo -e ${BOLD})Senha do PostgreSQL [padrão: gerar automático]: $(echo -e ${NC})" PG_PASS
if [ -z "$PG_PASS" ]; then
  PG_PASS=$(openssl rand -hex 16)
  info "Senha gerada: $PG_PASS"
fi

read -rp "$(echo -e ${BOLD})JWT Secret [padrão: gerar automático]: $(echo -e ${NC})" JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  info "JWT Secret gerado."
fi

read -rp "$(echo -e ${BOLD})Crypto Key (auth interna) [padrão: gerar automático]: $(echo -e ${NC})" CRYPTO_KEY
if [ -z "$CRYPTO_KEY" ]; then
  CRYPTO_KEY=$(openssl rand -hex 24)
  info "Crypto Key gerada."
fi

INSTALL_DIR="/opt/userbot-saas"
read -rp "$(echo -e ${BOLD})Diretório de instalação [padrão: $INSTALL_DIR]: $(echo -e ${NC})" CUSTOM_DIR
[ -n "$CUSTOM_DIR" ] && INSTALL_DIR="$CUSTOM_DIR"

echo ""
info "Configurações coletadas:"
echo -e "  Domínio   : ${BOLD}$DOMAIN${NC}"
echo -e "  E-mail    : ${BOLD}$LETSENCRYPT_EMAIL${NC}"
echo -e "  Diretório : ${BOLD}$INSTALL_DIR${NC}"
echo ""
read -rp "Confirmar e prosseguir? [s/N]: " CONFIRM
[[ ! "$CONFIRM" =~ ^[Ss]$ ]] && err "Instalação cancelada."

# ═══════════════════════════════════════════════════════════════════
step "2/8 — Instalando dependências do sistema"
# ═══════════════════════════════════════════════════════════════════

apt-get update -qq
apt-get install -y -qq \
  curl wget git openssl ca-certificates \
  gnupg lsb-release apt-transport-https \
  python3 python3-pip 2>/dev/null
ok "Dependências instaladas"

# ═══════════════════════════════════════════════════════════════════
step "3/8 — Instalando Docker"
# ═══════════════════════════════════════════════════════════════════

if command -v docker &>/dev/null; then
  ok "Docker já instalado: $(docker --version)"
else
  info "Instalando Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
  ok "Docker instalado: $(docker --version)"
fi

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  info "Instalando Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
  ok "Docker Compose instalado"
else
  ok "Docker Compose disponível"
fi

# ═══════════════════════════════════════════════════════════════════
step "4/8 — Configurando rede Docker (Traefik)"
# ═══════════════════════════════════════════════════════════════════

# Rede compartilhada entre Traefik e a aplicação.
# Pode ser sobrescrita antes de executar o instalador:
# TRAEFIK_NETWORK=outra_rede bash install.sh
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-minha_rede}"

if ! docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1; then
  docker network create "$TRAEFIK_NETWORK"
  ok "Rede '$TRAEFIK_NETWORK' criada"
else
  ok "Rede '$TRAEFIK_NETWORK' já existe"
fi

# Verificar se Traefik está rodando
TRAEFIK_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i 'traefik' | head -n 1 || true)
if [ -z "$TRAEFIK_CONTAINER" ]; then
  warn "Traefik não encontrado. Subindo Traefik..."
  mkdir -p /opt/traefik
  cat > /opt/traefik/docker-compose.yml << TRAEFIK_EOF
version: '3.8'
services:
  traefik:
    image: traefik:v2.11
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=$TRAEFIK_NETWORK
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=$LETSENCRYPT_EMAIL
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - proxy
networks:
  proxy:
    name: $TRAEFIK_NETWORK
    external: true
TRAEFIK_EOF
  mkdir -p /opt/traefik/letsencrypt
  touch /opt/traefik/letsencrypt/acme.json
  chmod 600 /opt/traefik/letsencrypt/acme.json
  cd /opt/traefik && docker compose up -d
  ok "Traefik iniciado"
else
  ok "Traefik já está rodando: $TRAEFIK_CONTAINER"

  TRAEFIK_NETWORK_MODE=$(docker inspect "$TRAEFIK_CONTAINER" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || true)

  if [ "$TRAEFIK_NETWORK_MODE" = "host" ] || [[ "$TRAEFIK_NETWORK_MODE" == container:* ]]; then
    warn "Traefik usa network_mode '$TRAEFIK_NETWORK_MODE'. O Docker não permite conectá-lo a redes adicionais."
    info "Mantendo o Traefik como está. A aplicação continuará na rede '$TRAEFIK_NETWORK' e será descoberta pelo provider Docker."
  elif ! docker inspect "$TRAEFIK_CONTAINER" --format '{{json .NetworkSettings.Networks}}' | grep -q "\"$TRAEFIK_NETWORK\""; then
    info "Conectando Traefik à rede '$TRAEFIK_NETWORK'..."
    set +e
    NETWORK_CONNECT_OUTPUT=$(docker network connect "$TRAEFIK_NETWORK" "$TRAEFIK_CONTAINER" 2>&1)
    NETWORK_CONNECT_STATUS=$?
    set -e
    if [ "$NETWORK_CONNECT_STATUS" -eq 0 ]; then
      ok "Traefik conectado à rede '$TRAEFIK_NETWORK'"
    else
      warn "Não foi possível conectar o Traefik à rede '$TRAEFIK_NETWORK'. Continuando a instalação."
      warn "$NETWORK_CONNECT_OUTPUT"
      warn "Se o domínio não abrir ao final, verificaremos a configuração do Traefik existente."
    fi
  else
    ok "Traefik já está conectado à rede '$TRAEFIK_NETWORK'"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
step "5/8 — Clonando repositório"
# ═══════════════════════════════════════════════════════════════════

if [ -d "$INSTALL_DIR" ]; then
  warn "Diretório $INSTALL_DIR já existe. Atualizando..."
  cd "$INSTALL_DIR"
  git pull
else
  git clone https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi
ok "Repositório pronto em $INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════
step "6/8 — Gerando arquivo .env"
# ═══════════════════════════════════════════════════════════════════

# Nome da imagem buildada localmente
DOCKER_IMAGE="inforlozzi/userbot-v3:latest"

cat > "$INSTALL_DIR/.env" << ENV_EOF
# ── Gerado automaticamente pelo install.sh ──────────────────────────
# Data: $(date '+%Y-%m-%d %H:%M:%S')

# Domínio
DOMAIN=$DOMAIN
LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=userbot_saas
DATABASE_URL=postgresql://postgres:$PG_PASS@postgres:5432/userbot_saas

# Redis
REDIS_URL=redis://redis:6379

# Auth
JWT_SECRET=$JWT_SECRET
CRYPTO_KEY=$CRYPTO_KEY

# Docker
DOCKER_IMAGE=$DOCKER_IMAGE
TRAEFIK_NETWORK=$TRAEFIK_NETWORK

# Next.js
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$JWT_SECRET
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
ENV_EOF

ok ".env gerado em $INSTALL_DIR/.env"

# ═══════════════════════════════════════════════════════════════════
step "7/8 — Build local e deploy dos containers"
# ═══════════════════════════════════════════════════════════════════

cd "$INSTALL_DIR"

# Build da imagem do bot a partir do Dockerfile local (sem Docker Hub)
if [ -f "Dockerfile" ]; then
  info "Buildando imagem do bot localmente: $DOCKER_IMAGE ..."
  docker build -t "$DOCKER_IMAGE" .
  ok "Imagem $DOCKER_IMAGE buildada com sucesso"
else
  warn "Dockerfile não encontrado na raiz. O docker compose fará o build automaticamente."
fi

info "Buildando e subindo todos os containers..."
docker compose up -d --build

info "Aguardando containers iniciarem (30s)..."
sleep 30

# ═══════════════════════════════════════════════════════════════════
step "8/8 — Verificação final"
# ═══════════════════════════════════════════════════════════════════

for container in inforlozzi-saas-api-1 inforlozzi-saas-web-1 inforlozzi-saas-postgres-1 inforlozzi-saas-redis-1; do
  if docker ps | grep -q "$container"; then
    ok "$container está rodando"
  else
    warn "$container NÃO está rodando"
  fi
done

# Salvar credenciais
CREDS_FILE="$INSTALL_DIR/.credentials"
cat > "$CREDS_FILE" << CREDS_EOF
═══════════════════════════════════════
  UserBot SaaS — Credenciais
  Gerado em: $(date '+%Y-%m-%d %H:%M:%S')
═══════════════════════════════════════

URL do Painel : https://$DOMAIN
API URL       : https://$DOMAIN/api

PostgreSQL
  Usuário   : postgres
  Senha     : $PG_PASS
  Database  : userbot_saas

JWT Secret  : $JWT_SECRET
Crypto Key  : $CRYPTO_KEY

Arquivo .env: $INSTALL_DIR/.env

COMMANDS ÚTEIS:
  Ver containers : docker ps
  Logs API       : docker logs -f inforlozzi-saas-api-1
  Logs Web       : docker logs -f inforlozzi-saas-web-1
  Reiniciar      : cd $INSTALL_DIR && docker compose restart
  Atualizar      : cd $INSTALL_DIR && git pull && docker compose up -d --build
═══════════════════════════════════════
CREDS_EOF
chmod 600 "$CREDS_FILE"

# ── Resumo final ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  ✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Painel Web : ${BOLD}https://$DOMAIN${NC}"
echo -e "  📡 API        : ${BOLD}https://$DOMAIN/api${NC}"
echo -e "  📁 Instalação : ${BOLD}$INSTALL_DIR${NC}"
echo -e "  🔑 Credenciais: ${BOLD}$CREDS_FILE${NC}"
echo ""
echo -e "${YELLOW}  ⚠️  Guarde o arquivo .credentials em local seguro!${NC}"
echo ""
echo -e "  Próximos passos:"
echo -e "  1. Acesse https://$DOMAIN e crie sua conta admin"
echo -e "  2. No painel, crie seu primeiro bot"
echo -e "  3. Autentique a conta Telegram via SMS"
echo -e "  4. Configure origens, destinos e IA no Telegram"
echo ""
echo -e "  Logs em tempo real:"
echo -e "  ${CYAN}docker logs -f inforlozzi-saas-api-1${NC}"
echo ""
echo -e "  Documentação: ${CYAN}https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3${NC}"
echo ""
