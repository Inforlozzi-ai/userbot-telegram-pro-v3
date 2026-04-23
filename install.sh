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

read -rp "$(echo -e ${BOLD})E-mail para Let's Encrypt (HTTPS): $(echo -e ${NC})" LETSENCRYPT_EMAIL
[ -z "$LETSENCRYPT_EMAIL" ] && err "E-mail obrigatório."

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

read -rp "$(echo -e ${BOLD})Imagem Docker do bot [padrão: inforlozzi/userbot-v3:latest]: $(echo -e ${NC})" DOCKER_IMAGE
[ -z "$DOCKER_IMAGE" ] && DOCKER_IMAGE="inforlozzi/userbot-v3:latest"

INSTALL_DIR="/opt/userbot-saas"
read -rp "$(echo -e ${BOLD})Diretório de instalação [padrão: $INSTALL_DIR]: $(echo -e ${NC})" CUSTOM_DIR
[ -n "$CUSTOM_DIR" ] && INSTALL_DIR="$CUSTOM_DIR"

echo ""
info "Configurações coletadas:"
echo -e "  Domínio     : ${BOLD}$DOMAIN${NC}"
echo -e "  E-mail      : ${BOLD}$LETSENCRYPT_EMAIL${NC}"
echo -e "  Diretório   : ${BOLD}$INSTALL_DIR${NC}"
echo -e "  Docker Image: ${BOLD}$DOCKER_IMAGE${NC}"
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

if ! docker network ls | grep -q minha_rede; then
  docker network create minha_rede
  ok "Rede 'minha_rede' criada"
else
  ok "Rede 'minha_rede' já existe"
fi

# Verificar se Traefik está rodando
if ! docker ps | grep -q traefik; then
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
      - --providers.docker.network=minha_rede
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
      - minha_rede
networks:
  minha_rede:
    external: true
TRAEFIK_EOF
  mkdir -p /opt/traefik/letsencrypt
  touch /opt/traefik/letsencrypt/acme.json
  chmod 600 /opt/traefik/letsencrypt/acme.json
  cd /opt/traefik && docker compose up -d
  ok "Traefik iniciado"
else
  ok "Traefik já está rodando"
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
TRAEFIK_NETWORK=minha_rede

# Next.js
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$JWT_SECRET
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
ENV_EOF

ok ".env gerado em $INSTALL_DIR/.env"

# ═══════════════════════════════════════════════════════════════════
step "7/8 — Build e deploy dos containers"
# ═══════════════════════════════════════════════════════════════════

cd "$INSTALL_DIR"

info "Fazendo pull da imagem do bot..."
docker pull "$DOCKER_IMAGE" 2>/dev/null || warn "Não foi possível fazer pull de $DOCKER_IMAGE (será feito no primeiro deploy)"

info "Fazendo build e subindo containers..."
docker compose up -d --build

info "Aguardando containers iniciarem (30s)..."
sleep 30

# ═══════════════════════════════════════════════════════════════════
step "8/8 — Verificação final"
# ═══════════════════════════════════════════════════════════════════

ERROS=0

for container in inforlozzi-saas-api-1 inforlozzi-saas-web-1 inforlozzi-saas-postgres-1 inforlozzi-saas-redis-1; do
  if docker ps | grep -q "$container"; then
    ok "$container está rodando"
  else
    warn "$container NÃO está rodando"
    ERRROS=$((ERRROS + 1))
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
