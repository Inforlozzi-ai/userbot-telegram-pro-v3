#!/bin/bash
# ================================================================
#   INFORLOZZI SAAS — INSTALADOR INTERATIVO
#   Plataforma de bots Telegram com painel web, billing e reseller
# ================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

REPO_URL="https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3.git"
INSTALL_DIR="/opt/inforlozzi-saas"

pausar() { echo ""; read -rp "  Pressione ENTER para continuar..." _x; }
limpar() { clear; }

titulo() {
  limpar
  echo -e "${CYAN}${BOLD}"
  echo "  ╔════════════════════════════════════════════════════════════╗"
  echo "  ║   🤖 INFORLOZZI SaaS — INSTALADOR INTERATIVO v1.0  🚀    ║"
  echo "  ╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

step() {
  echo -e "\n  ${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${CYAN}${BOLD}  $1${NC}"
  echo -e "  ${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
erro() { echo -e "  ${RED}❌ $1${NC}"; }

# ──────────────────────────────────────────────────────────────────
# VERIFICAÇÕES INICIAIS
# ──────────────────────────────────────────────────────────────────
titulo
echo -e "  Bem-vindo ao instalador da plataforma ${BOLD}Inforlozzi SaaS${NC}."
echo -e "  Este wizard irá configurar tudo automaticamente.\n"
echo -e "  ${YELLOW}Requisitos: Ubuntu 20.04+, acesso root, domínio apontado para este servidor.${NC}\n"
read -rp "  Pressione ENTER para começar ou Ctrl+C para cancelar... " _

# Root check
if [ "$EUID" -ne 0 ]; then
  erro "Execute como root: sudo bash setup-saas.sh"
  exit 1
fi

# ──────────────────────────────────────────────────────────────────
# PASSO 1 — DEPENDÊNCIAS
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 1 / 9 — Verificando dependências"

# Docker
if ! command -v docker &>/dev/null; then
  warn "Docker não encontrado. Instalando..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker --now
  ok "Docker instalado!"
else
  ok "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
fi

# Docker Compose v2
if ! docker compose version &>/dev/null 2>&1; then
  warn "Docker Compose v2 não encontrado. Instalando..."
  COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
  curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  ok "Docker Compose instalado!"
else
  ok "Docker Compose: $(docker compose version --short)"
fi

# Git
if ! command -v git &>/dev/null; then
  warn "Git não encontrado. Instalando..."
  apt-get install -y git -q
  ok "Git instalado!"
else
  ok "Git: $(git --version | cut -d' ' -f3)"
fi

# Node.js (para gerar segredos)
if ! command -v node &>/dev/null; then
  warn "Node.js não encontrado. Instalando..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs -q
  ok "Node.js instalado!"
else
  ok "Node.js: $(node --version)"
fi

pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 2 — CLONAR / ATUALIZAR REPOSITÓRIO
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 2 / 9 — Repositório"

if [ -d "$INSTALL_DIR/.git" ]; then
  warn "Repositório já existe em $INSTALL_DIR. Atualizando..."
  git -C "$INSTALL_DIR" pull --ff-only
  ok "Repositório atualizado!"
else
  echo -e "  📥 Clonando repositório em ${CYAN}$INSTALL_DIR${NC}..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  ok "Repositório clonado!"
fi

cd "$INSTALL_DIR"
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 3 — DOMÍNIO E E-MAIL
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 3 / 9 — Domínio e SSL"

echo -e "  Informe o domínio que aponta para este servidor."
echo -e "  ${YELLOW}Ex: painel.minhaempresa.com.br${NC}"
echo -e "  ${YELLOW}⚠️  O DNS já deve estar apontado para o IP deste servidor!${NC}\n"

while true; do
  read -rp "  Domínio: " DOMINIO
  DOMINIO=$(echo "$DOMINIO" | tr -d ' ' | tr '[:upper:]' '[:lower:]')
  if [[ "$DOMINIO" =~ ^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$ ]]; then
    break
  fi
  erro "Domínio inválido. Ex: painel.seusite.com.br"
done

echo ""
read -rp "  E-mail para certificado SSL (Let's Encrypt): " EMAIL_SSL
while [[ ! "$EMAIL_SSL" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; do
  erro "E-mail inválido."
  read -rp "  E-mail: " EMAIL_SSL
done

ok "Domínio: $DOMINIO"
ok "E-mail SSL: $EMAIL_SSL"
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 4 — BANCO DE DADOS
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 4 / 9 — Banco de dados (PostgreSQL)"

echo -e "  Defina a senha do banco de dados PostgreSQL."
echo -e "  ${YELLOW}Use uma senha forte (mín. 12 caracteres).${NC}\n"

while true; do
  read -rsp "  Senha do banco (oculta): " DB_PASS; echo
  read -rsp "  Confirme a senha: " DB_PASS2; echo
  if [ "$DB_PASS" = "$DB_PASS2" ] && [ ${#DB_PASS} -ge 8 ]; then
    break
  fi
  erro "Senhas não coincidem ou muito curta (mín. 8 caracteres)."
done

ok "Senha do banco definida!"
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 5 — ASAAS (PAGAMENTOS)
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 5 / 9 — Asaas (Pagamentos)"

echo -e "  O Asaas é usado para cobrar assinaturas dos seus clientes.\n"
echo -e "  ${CYAN}[1]${NC} Tenho conta Asaas e vou configurar agora"
echo -e "  ${CYAN}[2]${NC} Pular por enquanto (sem cobrança automática)\n"
read -rp "  Escolha: " OP_ASAAS

ASAAS_API_KEY=""
ASAAS_WEBHOOK_TOKEN=""
ASAAS_PLAN_STARTER=""
ASAAS_PLAN_PRO=""
ASAAS_PLAN_AGENCY=""

if [ "$OP_ASAAS" = "1" ]; then
  echo -e "\n  Acesse: ${CYAN}https://app.asaas.com${NC} → Configurações → API Keys\n"
  read -rp "  Asaas API Key: " ASAAS_API_KEY
  ASAAS_WEBHOOK_TOKEN=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
  echo -e "\n  IDs dos planos (Asaas → Assinaturas → Planos → copie o ID):"
  read -rp "  ID Plano Starter (R\$49,90/mês): " ASAAS_PLAN_STARTER
  read -rp "  ID Plano Pro     (R\$99,90/mês): " ASAAS_PLAN_PRO
  read -rp "  ID Plano Agency  (R\$299,90/mês): " ASAAS_PLAN_AGENCY
  ok "Asaas configurado!"
else
  ASAAS_WEBHOOK_TOKEN=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
  warn "Asaas pulado — configure depois no .env"
fi
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 6 — BOT DE NOTIFICAÇÕES TELEGRAM
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 6 / 9 — Bot de Notificações Telegram"

echo -e "  O sistema envia notificações automáticas via Telegram:"
echo -e "  • Pagamento confirmado → revendedor"
echo -e "  • Bot com erro → dono do bot"
echo -e "  • Bot provisionado com sucesso\n"
echo -e "  Crie um bot em ${CYAN}@BotFather${NC} → /newbot e cole o token abaixo."
echo -e "  ${YELLOW}Pode usar o mesmo bot que já usa como bot principal.${NC}\n"
echo -e "  ${CYAN}[1]${NC} Configurar agora"
echo -e "  ${CYAN}[2]${NC} Pular (notificações desativadas)\n"
read -rp "  Escolha: " OP_NOTIFY

NOTIFY_BOT_TOKEN=""
if [ "$OP_NOTIFY" = "1" ]; then
  read -rp "  Token do bot (@BotFather): " NOTIFY_BOT_TOKEN
  while [[ ! "$NOTIFY_BOT_TOKEN" == *":"* ]]; do
    erro "Token inválido (deve conter ':')"
    read -rp "  Token: " NOTIFY_BOT_TOKEN
  done
  ok "Bot de notificações configurado!"
else
  warn "Notificações desativadas. Configure NOTIFY_BOT_TOKEN no .env depois."
fi
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 7 — DOCKER IMAGE DO BOT
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 7 / 9 — Imagem Docker do Bot"

echo -e "  O sistema provisionará containers para cada cliente."
echo -e "  Precisa da imagem Docker do seu ${BOLD}bot.py${NC}.\n"
echo -e "  ${CYAN}[1]${NC} Construir imagem agora a partir do repositório ✅ recomendado"
echo -e "  ${CYAN}[2]${NC} Usar imagem existente do Docker Hub\n"
read -rp "  Escolha: " OP_IMAGE

DOCKER_IMAGE="inforlozzi/userbot-v3:latest"
if [ "$OP_IMAGE" = "2" ]; then
  read -rp "  Nome da imagem (ex: usuario/meubot:latest): " DOCKER_IMAGE
  ok "Imagem definida: $DOCKER_IMAGE"
else
  echo -e "\n  🔨 Construindo imagem Docker do bot..."
  docker build -t "$DOCKER_IMAGE" "$INSTALL_DIR" \
    -f "$INSTALL_DIR/Dockerfile" 2>&1 | tail -5
  ok "Imagem construída: $DOCKER_IMAGE"
fi
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 8 — GERAR SEGREDOS E CRIAR .ENV
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 8 / 9 — Gerando configuração"

echo -e "  Gerando chaves criptográficas...\n"

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
CRYPTO_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

ok "JWT_SECRET gerado (128 chars)"
ok "CRYPTO_KEY gerado (64 chars hex)"

# Substituir domínio no docker-compose.yml
sed -i "s|seudominio.com.br|${DOMINIO}|g" "$INSTALL_DIR/docker-compose.yml"
sed -i "s|seu@email.com|${EMAIL_SSL}|g"   "$INSTALL_DIR/docker-compose.yml"
ok "docker-compose.yml configurado com domínio!"

# Criar .env
cat > "$INSTALL_DIR/.env" << ENVEOF
# ── Banco de dados ──────────────────────────────────────────────
POSTGRES_USER=inforlozzi
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=inforlozzi
DATABASE_URL=postgresql://inforlozzi:${DB_PASS}@postgres:5432/inforlozzi

# ── Redis ────────────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379

# ── JWT & Criptografia ───────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
CRYPTO_KEY=${CRYPTO_KEY}

# ── Docker ───────────────────────────────────────────────────────
DOCKER_IMAGE=${DOCKER_IMAGE}

# ── Asaas ────────────────────────────────────────────────────────
ASAAS_API_KEY=${ASAAS_API_KEY}
ASAAS_WEBHOOK_TOKEN=${ASAAS_WEBHOOK_TOKEN}
ASAAS_PLAN_STARTER=${ASAAS_PLAN_STARTER}
ASAAS_PLAN_PRO=${ASAAS_PLAN_PRO}
ASAAS_PLAN_AGENCY=${ASAAS_PLAN_AGENCY}

# ── Notificações Telegram ────────────────────────────────────────
NOTIFY_BOT_TOKEN=${NOTIFY_BOT_TOKEN}

# ── Next.js ──────────────────────────────────────────────────────
INTERNAL_API_URL=http://api:3001
NEXT_PUBLIC_APP_URL=https://${DOMINIO}
ENVEOF

chmod 600 "$INSTALL_DIR/.env"
ok ".env criado em $INSTALL_DIR/.env"
pausar

# ──────────────────────────────────────────────────────────────────
# PASSO 9 — SUBIR STACK E MIGRATIONS
# ──────────────────────────────────────────────────────────────────
titulo
step "PASSO 9 / 9 — Subindo a stack"

cd "$INSTALL_DIR"

echo -e "  🐳 Iniciando containers (pode demorar alguns minutos na primeira vez)...\n"
docker compose up -d --build 2>&1 | grep -E '(Building|built|Started|healthy|error|Error)' || true

echo -e "\n  ⏳ Aguardando PostgreSQL ficar pronto..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U inforlozzi &>/dev/null; then
    ok "PostgreSQL pronto!"
    break
  fi
  sleep 2
  printf "."
done
echo ""

echo -e "\n  📦 Executando migrations do banco de dados..."
docker compose exec -T api npm run migration:run 2>&1 | tail -8
ok "Migrations executadas!"

# ──────────────────────────────────────────────────────────────────
# CONFIGURAR WEBHOOK ASAAS (se configurado)
# ──────────────────────────────────────────────────────────────────
if [ -n "$ASAAS_API_KEY" ]; then
  echo -e "\n  🔗 Registrando webhook no Asaas..."
  WEBHOOK_RESP=$(curl -s -X POST https://www.asaas.com/api/v3/webhooks \
    -H "access_token: $ASAAS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"https://${DOMINIO}/webhooks/asaas\",
      \"email\": \"${EMAIL_SSL}\",
      \"enabled\": true,
      \"interrupted\": false,
      \"authToken\": \"${ASAAS_WEBHOOK_TOKEN}\",
      \"events\": [\"PAYMENT_RECEIVED\",\"PAYMENT_CONFIRMED\",\"PAYMENT_OVERDUE\",\"SUBSCRIPTION_INACTIVATED\"]
    }" 2>/dev/null)
  if echo "$WEBHOOK_RESP" | grep -q '"id"'; then
    ok "Webhook Asaas registrado automaticamente!"
  else
    warn "Não foi possível registrar webhook automaticamente."
    echo -e "  Registre manualmente: ${CYAN}https://${DOMINIO}/webhooks/asaas${NC}"
    echo -e "  Token: ${YELLOW}${ASAAS_WEBHOOK_TOKEN}${NC}"
  fi
fi

# ──────────────────────────────────────────────────────────────────
# VERIFICAÇÃO FINAL
# ──────────────────────────────────────────────────────────────────
titulo
echo -e "  ${BOLD}📊 STATUS DOS CONTAINERS${NC}\n"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "  ${BOLD}🔍 Verificando serviços...${NC}\n"

API_OK=false
for i in $(seq 1 15); do
  if curl -sf http://localhost:3001/api/auth/login -X POST \
     -H 'Content-Type: application/json' \
     -d '{"email":"x","password":"x"}' &>/dev/null; then
    API_OK=true; break
  fi
  sleep 2; printf "."
done
echo ""

if $API_OK; then
  ok "API respondendo na porta 3001"
else
  warn "API ainda inicializando — verifique com: docker compose logs api"
fi

# ──────────────────────────────────────────────────────────────────
# RESUMO FINAL
# ──────────────────────────────────────────────────────────────────
titulo
echo -e "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════╗"
echo "  ║         🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO! 🎉           ║"
echo "  ╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${BOLD}🌐 Acesse o painel:${NC}"
echo -e "     ${CYAN}https://${DOMINIO}${NC}\n"

echo -e "  ${BOLD}📁 Arquivos:${NC}"
echo -e "     Instalação : ${YELLOW}$INSTALL_DIR${NC}"
echo -e "     Configuração: ${YELLOW}$INSTALL_DIR/.env${NC}\n"

if [ -n "$ASAAS_API_KEY" ]; then
echo -e "  ${BOLD}💳 Webhook Asaas:${NC}"
echo -e "     URL   : ${CYAN}https://${DOMINIO}/webhooks/asaas${NC}"
echo -e "     Token : ${YELLOW}${ASAAS_WEBHOOK_TOKEN}${NC}\n"
fi

echo -e "  ${BOLD}🛠 Comandos úteis:${NC}"
echo -e "     Ver logs da API  : ${CYAN}cd $INSTALL_DIR && docker compose logs -f api${NC}"
echo -e "     Ver todos os logs: ${CYAN}cd $INSTALL_DIR && docker compose logs -f${NC}"
echo -e "     Status containers: ${CYAN}cd $INSTALL_DIR && docker compose ps${NC}"
echo -e "     Atualizar sistema : ${CYAN}cd $INSTALL_DIR && git pull && docker compose up -d --build${NC}\n"

echo -e "  ${BOLD}📋 Próximos passos:${NC}"
echo -e "     1. Acesse ${CYAN}https://${DOMINIO}${NC} e crie sua conta"
echo -e "     2. Vá em ${CYAN}Meus Bots → + Novo Bot${NC} e siga o wizard"
echo -e "     3. Para revender, acesse ${CYAN}Painel Revendedor${NC}\n"

echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}  GUARDE O ARQUIVO .env EM LOCAL SEGURO!${NC}"
echo -e "  ${YELLOW}  Ele contém todas as suas chaves e senhas.${NC}"
echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
