#!/bin/bash
# ============================================================
#   USERBOT TELEGRAM PRO v3 — GERENCIADOR MULTI-BOT + IA
# ============================================================
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_RAW="https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main"

pausar() { echo ""; read -p "  Pressione ENTER para continuar..." x; }
limpar() { clear; }

titulo() {
  limpar
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║   🤖 USERBOT TELEGRAM PRO v3 — MULTI-BOT + IA 🧠   ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# ── MENU PRINCIPAL ─────────────────────────────────────────
menu_principal() {
  titulo
  bots=($(docker ps -a --format "{{.Names}}" 2>/dev/null | grep "^userbot-"))
  if [ ${#bots[@]} -gt 0 ]; then
    echo -e "  ${BOLD}Bots instalados:${NC}"
    for nome in "${bots[@]}"; do
      status=$(docker inspect --format='{{.State.Status}}' "$nome" 2>/dev/null)
      icon="🔴"; [ "$status" = "running" ] && icon="🟢"
      # Mostrar se IA está ativa
      ia_tag=""
      has_oai=$(docker inspect "$nome" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^OPENAI_API_KEY=" | cut -d= -f2)
      has_gem=$(docker inspect "$nome" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^GEMINI_API_KEY=" | cut -d= -f2)
      [ -n "$has_oai" ] && ia_tag=" 🧠OAI"
      [ -n "$has_gem" ] && ia_tag="$ia_tag 🧠GEM"
      echo -e "    $icon  $nome  (${status})${ia_tag}"
    done
    echo ""
  fi

  echo -e "  ${CYAN}[1]${NC} 🆕 Instalar novo bot"
  echo -e "  ${CYAN}[2]${NC} 📋 Gerenciar bots"
  echo -e "  ${CYAN}[3]${NC} 🗑  Desinstalar bot"
  echo -e "  ${CYAN}[4]${NC} 📊 Ver logs em tempo real"
  echo -e "  ${CYAN}[5]${NC} 🔁 Regerar Session String de um bot"
  echo -e "  ${CYAN}[6]${NC} 🔄 Atualizar TODOS os bots (baixa e reinicia tudo)"
  echo -e "  ${CYAN}[7]${NC} 🧠 Configurar IA de um bot (OpenAI / Gemini)"
  echo -e "  ${CYAN}[8]${NC} 🧹 Limpar tudo (todos os bots)"
  echo -e "  ${CYAN}[9]${NC} ❌ Sair"
  echo ""
  read -p "  Escolha [1-9]: " op
  case $op in
    1) instalar_bot ;;
    2) gerenciar_bots ;;
    3) desinstalar_bot ;;
    4) ver_logs ;;
    5) regerar_session ;;
    6) atualizar_botpy ;;
    7) configurar_ia ;;
    8) limpar_tudo ;;
    9) echo -e "\n  ${GREEN}Até logo! 👋${NC}\n"; exit 0 ;;
    *) menu_principal ;;
  esac
}

# ── SELECIONAR BOT ─────────────────────────────────────────
selecionar_bot() {
  local prompt="$1"
  bots=($(docker ps -a --format "{{.Names}}" 2>/dev/null | grep "^userbot-"))
  if [ ${#bots[@]} -eq 0 ]; then
    echo -e "\n  ${YELLOW}Nenhum bot instalado.${NC}"
    pausar; menu_principal; return
  fi
  echo -e "\n  ${BOLD}$prompt${NC}"
  for i in "${!bots[@]}"; do
    nome="${bots[$i]}"
    status=$(docker inspect --format='{{.State.Status}}' "$nome" 2>/dev/null)
    icon="🔴"; [ "$status" = "running" ] && icon="🟢"
    echo -e "  ${CYAN}[$((i+1))]${NC} $icon $nome"
  done
  echo ""
  read -p "  Número: " num
  SELECTED_BOT="${bots[$((num-1))]}"
  if [ -z "$SELECTED_BOT" ]; then
    echo -e "  ${RED}Inválido.${NC}"; pausar; menu_principal
  fi
}

# ── CONFIGURAR IA ──────────────────────────────────────────
configurar_ia() {
  titulo
  selecionar_bot "Configurar IA de qual bot?"
  [ -z "$SELECTED_BOT" ] && return

  INSTALL_DIR="/opt/$SELECTED_BOT"

  titulo
  echo -e "  ${BOLD}🧠 CONFIGURAR IA — $SELECTED_BOT${NC}\n"

  # Lê keys atuais
  cur_oai=$(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^OPENAI_API_KEY=" | cut -d= -f2)
  cur_gem=$(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^GEMINI_API_KEY=" | cut -d= -f2)

  echo -e "  OpenAI Key atual : ${cur_oai:-(não definida)}"
  echo -e "  Gemini Key atual : ${cur_gem:-(não definida)}\n"

  echo -e "  ${CYAN}[1]${NC} Definir/Atualizar OpenAI API Key"
  echo -e "  ${CYAN}[2]${NC} Definir/Atualizar Gemini API Key"
  echo -e "  ${CYAN}[3]${NC} Definir ambas"
  echo -e "  ${CYAN}[4]${NC} Remover todas as keys de IA"
  echo -e "  ${CYAN}[5]${NC} Voltar\n"
  read -p "  Escolha: " op_ia

  NEW_OAI="$cur_oai"
  NEW_GEM="$cur_gem"

  case $op_ia in
    1)
      read -p "  Nova OpenAI API Key (sk-...): " NEW_OAI
      ;;
    2)
      read -p "  Nova Gemini API Key: " NEW_GEM
      ;;
    3)
      read -p "  OpenAI API Key (sk-...): " NEW_OAI
      read -p "  Gemini API Key: " NEW_GEM
      ;;
    4)
      NEW_OAI=""
      NEW_GEM=""
      echo -e "\n  ${YELLOW}Keys de IA removidas.${NC}"
      ;;
    *)
      menu_principal; return
      ;;
  esac

  # Reconstruir container com novas keys
  _recriar_container_com_ia "$SELECTED_BOT" "$NEW_OAI" "$NEW_GEM"
}

_recriar_container_com_ia() {
  local bot_name="$1"
  local new_oai="$2"
  local new_gem="$3"
  local INSTALL_DIR="/opt/$bot_name"

  # Extrair todas as variáveis existentes
  get_env() { docker inspect "$bot_name" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^$1=" | cut -d= -f2-; }

  local API_ID=$(get_env API_ID)
  local API_HASH=$(get_env API_HASH)
  local SESSION_STRING=$(get_env SESSION_STRING)
  local BOT_TOKEN=$(get_env BOT_TOKEN)
  local BOT_NOME=$(get_env BOT_NOME)
  local TARGET_GROUP_ID=$(get_env TARGET_GROUP_ID)
  local SOURCE_CHAT_IDS=$(get_env SOURCE_CHAT_IDS)
  local FORWARD_MODE=$(get_env FORWARD_MODE)
  local ADMIN_IDS=$(get_env ADMIN_IDS)

  echo -e "\n  🔄 Recriando container com nova configuração de IA..."

  docker rm -f "$bot_name" 2>/dev/null

  docker run -d \
    --name "$bot_name" \
    --restart unless-stopped \
    -e API_ID="$API_ID" \
    -e API_HASH="$API_HASH" \
    -e SESSION_STRING="$SESSION_STRING" \
    -e BOT_TOKEN="$BOT_TOKEN" \
    -e BOT_NOME="$BOT_NOME" \
    -e TARGET_GROUP_ID="$TARGET_GROUP_ID" \
    -e SOURCE_CHAT_IDS="$SOURCE_CHAT_IDS" \
    -e FORWARD_MODE="$FORWARD_MODE" \
    -e ADMIN_IDS="$ADMIN_IDS" \
    -e OPENAI_API_KEY="$new_oai" \
    -e GEMINI_API_KEY="$new_gem" \
    -v "$INSTALL_DIR/bot.py:/app/bot.py:ro" \
    -w /app \
    python:3.12-slim \
    bash -c "pip install telethon aiohttp Pillow -q --root-user-action=ignore && python bot.py" >/dev/null

  echo -e "  ⏳ Aguardando inicialização (10s)..."
  sleep 10

  if docker ps | grep -q "$bot_name"; then
    echo -e "  ${GREEN}✅ Bot reiniciado com IA configurada!${NC}"
    [ -n "$new_oai" ] && echo -e "  🧠 OpenAI: ativada"
    [ -n "$new_gem" ] && echo -e "  🧠 Gemini: ativada"
    echo -e "\n  ${YELLOW}Ative a IA pelo /menu → 🧠 IA no Telegram.${NC}"
  else
    echo -e "  ${RED}❌ Erro ao reiniciar. Logs:${NC}\n"
    docker logs "$bot_name" 2>&1 | tail -20
  fi
  pausar; menu_principal
}

# ── GERAR SESSION STRING ───────────────────────────────────
gerar_session_string() {
  local api_id="$1"
  local api_hash="$2"

  echo -e "\n  ${BOLD}📱 Gerando Session String...${NC}"
  echo -e "  ${YELLOW}Você precisará do número de telefone e código do Telegram.${NC}\n"

  cat > /tmp/gen_session.py << 'PYEOF'
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
import os

api_id  = int(os.environ.get("API_ID", "0"))
api_hash = os.environ.get("API_HASH", "")

async def main():
    async with TelegramClient(StringSession(), api_id, api_hash) as c:
        sess = c.session.save()
        print(sess, flush=True)
        with open("/tmp/session_out.txt", "w") as f:
            f.write(sess)

asyncio.run(main())
PYEOF

  rm -f /tmp/session_out.txt

  docker run --rm -it \
    -e API_ID="$api_id" \
    -e API_HASH="$api_hash" \
    -v /tmp/gen_session.py:/app/gen_session.py \
    -v /tmp:/tmp \
    python:3.12-slim \
    bash -c "pip install telethon -q --root-user-action=ignore 2>/dev/null && python /app/gen_session.py"

  rm -f /tmp/gen_session.py

  if [ -f /tmp/session_out.txt ]; then
    SESSION_GERADA=$(cat /tmp/session_out.txt)
    rm -f /tmp/session_out.txt
  fi

  if [ -z "$SESSION_GERADA" ] || [ ${#SESSION_GERADA} -lt 50 ]; then
    echo -e "\n  ${RED}❌ Geração falhou. Cole a Session String manualmente:${NC}"
    read -p "  SESSION_STRING: " SESSION_GERADA
  else
    echo -e "\n  ${GREEN}✅ Session String gerada com sucesso!${NC}"
  fi
}

# ── REGERAR SESSION DE BOT EXISTENTE ──────────────────────
regerar_session() {
  titulo
  selecionar_bot "Regerar session de qual bot?"
  [ -z "$SELECTED_BOT" ] && return

  INSTALL_DIR="/opt/$SELECTED_BOT"
  get_env() { docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^$1=" | cut -d= -f2-; }

  API_ID=$(get_env API_ID)
  API_HASH=$(get_env API_HASH)
  BOT_TOKEN=$(get_env BOT_TOKEN)
  BOT_NOME=$(get_env BOT_NOME)
  TARGET_GROUP_ID=$(get_env TARGET_GROUP_ID)
  SOURCE_CHAT_IDS=$(get_env SOURCE_CHAT_IDS)
  FORWARD_MODE=$(get_env FORWARD_MODE)
  ADMIN_IDS=$(get_env ADMIN_IDS)
  OPENAI_API_KEY=$(get_env OPENAI_API_KEY)
  GEMINI_API_KEY=$(get_env GEMINI_API_KEY)

  titulo
  echo -e "  ${BOLD}🔁 Regerando session de ${CYAN}$SELECTED_BOT${NC}\n"

  SESSION_GERADA=""
  gerar_session_string "$API_ID" "$API_HASH"

  if [ -z "$SESSION_GERADA" ] || [ ${#SESSION_GERADA} -lt 50 ]; then
    echo -e "  ${RED}❌ Session inválida. Abortando.${NC}"
    pausar; menu_principal; return
  fi

  sed -i "s|^SESSION_STRING=.*|SESSION_STRING=$SESSION_GERADA|" "$INSTALL_DIR/.env"

  docker rm -f "$SELECTED_BOT" 2>/dev/null

  docker run -d \
    --name "$SELECTED_BOT" \
    --restart unless-stopped \
    -e API_ID="$API_ID" \
    -e API_HASH="$API_HASH" \
    -e SESSION_STRING="$SESSION_GERADA" \
    -e BOT_TOKEN="$BOT_TOKEN" \
    -e BOT_NOME="$BOT_NOME" \
    -e TARGET_GROUP_ID="$TARGET_GROUP_ID" \
    -e SOURCE_CHAT_IDS="$SOURCE_CHAT_IDS" \
    -e FORWARD_MODE="$FORWARD_MODE" \
    -e ADMIN_IDS="$ADMIN_IDS" \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e GEMINI_API_KEY="$GEMINI_API_KEY" \
    -v "$INSTALL_DIR/bot.py:/app/bot.py:ro" \
    -w /app \
    python:3.12-slim \
    bash -c "pip install telethon aiohttp Pillow -q --root-user-action=ignore && python bot.py" >/dev/null

  echo -e "  ⏳ Aguardando inicialização (15s)..."
  sleep 15

  if docker ps | grep -q "$SELECTED_BOT"; then
    echo -e "  ${GREEN}✅ Bot reiniciado com nova session!${NC}"
  else
    echo -e "  ${RED}❌ Erro ao reiniciar. Logs:${NC}\n"
    docker logs "$SELECTED_BOT" 2>&1 | tail -20
  fi
  pausar; menu_principal
}

# ── ATUALIZAR TODOS OS BOTS ────────────────────────────────
atualizar_botpy() {
  titulo
  echo -e "  ${BOLD}🔄 ATUALIZAR TODOS OS BOTS${NC}\n"

  # Baixar o bot.py mais recente do repositório
  TMP_BOTPY="/tmp/bot.py.update"
  echo -e "  📥 Baixando bot.py mais recente..."
  if ! curl -fsSL "$REPO_RAW/bot.py" -o "$TMP_BOTPY" 2>/dev/null; then
    echo -e "  ${RED}❌ Falha ao baixar do repositório: $REPO_RAW${NC}"
    if [ -f "$SCRIPT_DIR/bot.py" ]; then
      cp "$SCRIPT_DIR/bot.py" "$TMP_BOTPY"
      echo -e "  ${YELLOW}⚠️  Usando bot.py da pasta local.${NC}"
    else
      echo -e "  ${RED}❌ Nenhuma fonte disponível. Abortando.${NC}"
      rm -f "$TMP_BOTPY"; pausar; menu_principal; return
    fi
  else
    echo -e "  ${GREEN}✅ bot.py baixado com sucesso!${NC}"
  fi

  # Listar todos os bots instalados
  bots=($(docker ps -a --format "{{.Names}}" 2>/dev/null | grep "^userbot-"))
  if [ ${#bots[@]} -eq 0 ]; then
    echo -e "\n  ${YELLOW}Nenhum bot instalado para atualizar.${NC}"
    rm -f "$TMP_BOTPY"; pausar; menu_principal; return
  fi

  echo -e "\n  ${BOLD}Bots encontrados: ${#bots[@]}${NC}\n"
  for nome in "${bots[@]}"; do
    status=$(docker inspect --format='{{.State.Status}}' "$nome" 2>/dev/null)
    icon="🔴"; [ "$status" = "running" ] && icon="🟢"
    echo -e "    $icon  $nome  ($status)"
  done

  echo ""
  read -p "  Atualizar todos agora? [s/N]: " conf
  if [[ ! "$conf" =~ ^[sS]$ ]]; then
    echo -e "  ${YELLOW}Cancelado.${NC}"
    rm -f "$TMP_BOTPY"; pausar; menu_principal; return
  fi

  echo ""
  OK=0; FAIL=0

  for nome in "${bots[@]}"; do
    INSTALL_DIR="/opt/$nome"
    echo -e "  ─────────────────────────────────────────"
    echo -e "  📦 ${CYAN}$nome${NC}"

    # Copiar o novo bot.py para a pasta do bot
    if cp "$TMP_BOTPY" "$INSTALL_DIR/bot.py" 2>/dev/null; then
      echo -e "  ${GREEN}✅ bot.py atualizado${NC}"
    else
      echo -e "  ${RED}❌ Falha ao copiar bot.py para $INSTALL_DIR${NC}"
      ((FAIL++))
      continue
    fi

    # Reiniciar o container
    if docker restart "$nome" >/dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Container reiniciado${NC}"
      ((OK++))
    else
      echo -e "  ${RED}❌ Falha ao reiniciar o container${NC}"
      ((FAIL++))
    fi
  done

  rm -f "$TMP_BOTPY"

  echo -e "\n  ─────────────────────────────────────────"
  echo -e "  ⏳ Aguardando inicialização (15s)..."
  sleep 15

  echo -e "\n  ${BOLD}📊 RESULTADO${NC}"
  echo -e "  ${GREEN}✅ Atualizados: $OK${NC}"
  [ $FAIL -gt 0 ] && echo -e "  ${RED}❌ Falhas: $FAIL${NC}"
  echo ""

  # Mostrar status final de todos
  for nome in "${bots[@]}"; do
    status=$(docker inspect --format='{{.State.Status}}' "$nome" 2>/dev/null)
    icon="🔴"; [ "$status" = "running" ] && icon="🟢"
    uptime=$(docker inspect --format='{{.State.StartedAt}}' "$nome" 2>/dev/null | cut -dT -f1)
    echo -e "    $icon  $nome  ($status)"
  done

  echo ""
  echo -e "  ${YELLOW}Use a opção [4] Ver logs para confirmar que reiniciaram sem erros.${NC}"
  pausar; menu_principal
}

# ── LIMPAR TUDO ────────────────────────────────────────────
limpar_tudo() {
  titulo
  echo -e "  ${RED}${BOLD}⚠️  ATENÇÃO — AÇÃO IRREVERSÍVEL!${NC}\n"
  echo -e "  Isso irá remover TODOS os containers userbot- e seus arquivos.\n"
  bots=($(docker ps -a --format "{{.Names}}" 2>/dev/null | grep "^userbot-"))
  if [ ${#bots[@]} -eq 0 ]; then
    echo -e "  ${YELLOW}Nenhum bot para remover.${NC}"
    pausar; menu_principal; return
  fi
  echo -e "  Serão removidos:"
  for nome in "${bots[@]}"; do echo -e "    • $nome"; done
  echo ""
  read -p "  Tem certeza? Digite CONFIRMAR: " conf
  if [ "$conf" = "CONFIRMAR" ]; then
    for nome in "${bots[@]}"; do
      docker rm -f "$nome" 2>/dev/null
      rm -rf "/opt/$nome"
      echo -e "  ${GREEN}✅ $nome removido${NC}"
    done
    echo -e "\n  ${GREEN}✅ Limpeza concluída!${NC}"
  else
    echo -e "\n  ${YELLOW}Cancelado.${NC}"
  fi
  pausar; menu_principal
}

# ── GERENCIAR ──────────────────────────────────────────────
gerenciar_bots() {
  titulo
  selecionar_bot "Selecione o bot:"
  [ -z "$SELECTED_BOT" ] && return
  titulo
  status=$(docker inspect --format='{{.State.Status}}' "$SELECTED_BOT" 2>/dev/null)
  icon="🔴"; [ "$status" = "running" ] && icon="🟢"
  echo -e "  Bot: ${CYAN}$SELECTED_BOT${NC} $icon ($status)\n"
  echo -e "  ${CYAN}[1]${NC} 📋 Ver logs (últimas 30 linhas)"
  echo -e "  ${CYAN}[2]${NC} 🔄 Reiniciar"
  echo -e "  ${CYAN}[3]${NC} ⏹  Parar"
  echo -e "  ${CYAN}[4]${NC} ▶️  Iniciar"
  echo -e "  ${CYAN}[5]${NC} 🔍 Inspecionar variáveis"
  echo -e "  ${CYAN}[6]${NC} 🧠 Configurar IA deste bot"
  echo -e "  ${CYAN}[7]${NC} ⬅️  Voltar"
  echo ""
  read -p "  Escolha: " acao
  case $acao in
    1) titulo; echo -e "  ${BOLD}Logs de $SELECTED_BOT:${NC}\n"; docker logs "$SELECTED_BOT" 2>&1 | tail -30; pausar; gerenciar_bots ;;
    2) docker restart "$SELECTED_BOT" && echo -e "\n  ${GREEN}✅ Reiniciado!${NC}" || echo -e "\n  ${RED}❌ Erro${NC}"; pausar; gerenciar_bots ;;
    3) docker stop "$SELECTED_BOT" && echo -e "\n  ${GREEN}✅ Parado!${NC}" || echo -e "\n  ${RED}❌ Erro${NC}"; pausar; gerenciar_bots ;;
    4) docker start "$SELECTED_BOT" && echo -e "\n  ${GREEN}✅ Iniciado!${NC}" || echo -e "\n  ${RED}❌ Erro${NC}"; pausar; gerenciar_bots ;;
    5) titulo; echo -e "  ${BOLD}Variáveis de $SELECTED_BOT:${NC}\n"
       docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' | grep -E "^(API_ID|BOT_TOKEN|TARGET_GROUP_ID|SOURCE_CHAT_IDS|FORWARD_MODE|BOT_NOME|ADMIN_IDS)"
       echo "  OPENAI_KEY: $(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^OPENAI_API_KEY=" | cut -d= -f2 | sed 's/.\{4\}$/****/')"
       echo "  GEMINI_KEY: $(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^GEMINI_API_KEY=" | cut -d= -f2 | sed 's/.\{4\}$/****/')"
       pausar; gerenciar_bots ;;
    6) SELECTED_BOT_BACKUP="$SELECTED_BOT"; configurar_ia_selecionado "$SELECTED_BOT_BACKUP" ;;
    7) menu_principal ;;
    *) gerenciar_bots ;;
  esac
}

configurar_ia_selecionado() {
  SELECTED_BOT="$1"
  cur_oai=$(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^OPENAI_API_KEY=" | cut -d= -f2)
  cur_gem=$(docker inspect "$SELECTED_BOT" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^GEMINI_API_KEY=" | cut -d= -f2)
  titulo
  echo -e "  ${BOLD}🧠 IA — $SELECTED_BOT${NC}\n"
  echo -e "  OpenAI Key : ${cur_oai:-(não definida)}"
  echo -e "  Gemini Key : ${cur_gem:-(não definida)}\n"
  echo -e "  ${CYAN}[1]${NC} Atualizar OpenAI Key"
  echo -e "  ${CYAN}[2]${NC} Atualizar Gemini Key"
  echo -e "  ${CYAN}[3]${NC} Voltar\n"
  read -p "  Escolha: " op
  case $op in
    1) read -p "  OpenAI Key: " NEW_OAI; _recriar_container_com_ia "$SELECTED_BOT" "$NEW_OAI" "$cur_gem" ;;
    2) read -p "  Gemini Key: " NEW_GEM; _recriar_container_com_ia "$SELECTED_BOT" "$cur_oai" "$NEW_GEM" ;;
    *) gerenciar_bots ;;
  esac
}

# ── VER LOGS ───────────────────────────────────────────────
ver_logs() {
  titulo
  selecionar_bot "Ver logs de qual bot?"
  [ -z "$SELECTED_BOT" ] && return
  echo -e "\n  ${YELLOW}Pressione Ctrl+C para sair dos logs${NC}\n"
  docker logs -f "$SELECTED_BOT" 2>&1
  pausar; menu_principal
}

# ── DESINSTALAR ────────────────────────────────────────────
desinstalar_bot() {
  titulo
  selecionar_bot "Qual bot deseja remover?"
  [ -z "$SELECTED_BOT" ] && return
  echo -e "\n  ${RED}${BOLD}⚠️  ATENÇÃO!${NC}"
  echo -e "  Isso vai apagar o container e os arquivos de ${CYAN}$SELECTED_BOT${NC}"
  read -p "  Tem certeza? [s/N]: " conf
  if [[ "$conf" =~ ^[sS]$ ]]; then
    docker rm -f "$SELECTED_BOT" 2>/dev/null
    rm -rf "/opt/$SELECTED_BOT"
    echo -e "\n  ${GREEN}✅ '$SELECTED_BOT' removido!${NC}"
  else
    echo -e "\n  ${YELLOW}Cancelado.${NC}"
  fi
  pausar; menu_principal
}

# ── INSTALAR ───────────────────────────────────────────────
instalar_bot() {
  [ "$EUID" -ne 0 ] && echo -e "  ${RED}Execute como root: sudo bash install.sh${NC}" && exit 1

  titulo
  echo -e "  ${BOLD}🔍 Verificando o sistema...${NC}\n"
  if ! command -v docker &>/dev/null; then
    echo -e "  ${YELLOW}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | bash >/dev/null 2>&1
    systemctl enable docker >/dev/null 2>&1; systemctl start docker >/dev/null 2>&1
    echo -e "  ${GREEN}✅ Docker instalado!${NC}"
  else
    echo -e "  ${GREEN}✅ Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"
  fi
  pausar

  # Passo 1 — Nome do bot
  titulo
  echo -e "  ${BOLD}🏷  PASSO 1 — Nome do bot${NC}\n"
  echo -e "  Dê um nome único para identificar este bot."
  echo -e "  ${YELLOW}Ex: principal, vendas, noticias, grupo2${NC}\n"
  read -p "  Nome (sem espaços): " BOT_SLUG
  BOT_SLUG=$(echo "${BOT_SLUG:-bot1}" | tr ' ' '-' | tr -cd 'a-zA-Z0-9-')
  CONTAINER_NAME="userbot-$BOT_SLUG"
  INSTALL_DIR="/opt/$CONTAINER_NAME"
  if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "\n  ${RED}❌ Já existe um bot com esse nome!${NC}"
    echo -e "  ${YELLOW}Escolha outro nome ou desinstale o existente primeiro.${NC}"
    pausar; instalar_bot; return
  fi
  echo -e "\n  ${GREEN}✅ Container: $CONTAINER_NAME${NC}"
  pausar

  # Passo 2 — Nome de exibição
  titulo
  echo -e "  ${BOLD}🏷  PASSO 2 — Nome de exibição${NC}\n"
  read -p "  Nome de exibição (padrão: UserBot): " BOT_NOME
  BOT_NOME="${BOT_NOME:-UserBot}"
  pausar

  # Passo 3 — API
  titulo
  echo -e "  ${BOLD}🔑 PASSO 3 — Chaves da API do Telegram${NC}\n"
  echo -e "  Acesse: ${CYAN}https://my.telegram.org${NC}"
  echo -e "  Login → API Development Tools → Crie um app\n"
  echo -e "  ${CYAN}[1]${NC} Usar API padrão (Inforlozzi) ✅ recomendado"
  echo -e "  ${CYAN}[2]${NC} Digitar outra API\n"
  read -p "  Escolha: " op_api
  if [ "$op_api" = "2" ]; then
    read -p "  API_ID (números): " API_ID
    while ! [[ "$API_ID" =~ ^[0-9]+$ ]]; do
      echo -e "  ${RED}❌ Apenas números!${NC}"; read -p "  API_ID: " API_ID
    done
    read -p "  API_HASH: " API_HASH
    while [ ${#API_HASH} -lt 10 ]; do
      echo -e "  ${RED}❌ Hash inválido!${NC}"; read -p "  API_HASH: " API_HASH
    done
  else
    API_ID="33720900"
    API_HASH="b42f6ce16216a7be8b55ba960e03ba2f"
    echo -e "  ${GREEN}✅ API carregada!${NC}"
  fi
  pausar

  # Passo 4 — Session String
  SESSION_STRING=""

  for cn in $(docker ps -a --format "{{.Names}}" | grep "^userbot-"); do
    existing_api=$(docker inspect "$cn" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^API_ID=" | cut -d= -f2)
    if [ "$existing_api" = "$API_ID" ]; then
      SESSION_STRING=$(docker inspect "$cn" --format='{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep "^SESSION_STRING=" | cut -d= -f2-)
      echo -e "\n  ${GREEN}✅ Session String reutilizada do bot '$cn'!${NC}"
      echo -e "  ${YELLOW}(Mesma conta Telegram)${NC}"
      pausar; break
    fi
  done

  if [ -z "$SESSION_STRING" ]; then
    titulo
    echo -e "  ${BOLD}📱 PASSO 4 — Conta do Telegram${NC}\n"
    echo -e "  ${CYAN}[1]${NC} Gerar nova Session String agora ✅ recomendado"
    echo -e "  ${CYAN}[2]${NC} Colar manualmente\n"
    read -p "  Escolha: " op_sess

    SESSION_GERADA=""
    if [ "$op_sess" = "2" ]; then
      read -p "  SESSION_STRING: " SESSION_STRING
    else
      gerar_session_string "$API_ID" "$API_HASH"
      SESSION_STRING="$SESSION_GERADA"
    fi

    if [ -z "$SESSION_STRING" ] || [ ${#SESSION_STRING} -lt 50 ]; then
      echo -e "\n  ${RED}❌ Session String inválida. Abortando instalação.${NC}"
      pausar; menu_principal; return
    fi
  fi
  pausar

  # Passo 5 — BOT TOKEN
  titulo
  echo -e "  ${BOLD}🤖 PASSO 5 — Token do Bot${NC}\n"
  echo -e "  Crie em ${CYAN}@BotFather${NC} → /newbot"
  echo -e "  ${YELLOW}⚠️  Cada bot paralelo precisa de um BOT TOKEN diferente!${NC}\n"
  read -p "  BOT_TOKEN: " BOT_TOKEN
  while [[ ! "$BOT_TOKEN" == *":"* ]]; do
    echo -e "  ${RED}❌ Token inválido!${NC}"; read -p "  BOT_TOKEN: " BOT_TOKEN
  done
  pausar

  # Passo 6 — Destinos
  titulo
  echo -e "  ${BOLD}🎯 PASSO 6 — Grupo(s) DESTINO${NC}\n"
  echo -e "  ${CYAN}[1]${NC} Configurar agora"
  echo -e "  ${CYAN}[2]${NC} Pular — configurar depois pelo /menu ✅\n"
  read -p "  Escolha: " op_dest
  TARGET_GROUP_ID=""
  if [ "$op_dest" = "1" ]; then
    echo -e "  Pode enviar vários IDs separados por vírgula."
    echo -e "  ${YELLOW}Use 🔎 Descobrir ID no bot para encontrar o ID${NC}\n"
    read -p "  ID(s) destino: " TARGET_GROUP_ID
    echo -e "  ${GREEN}✅ Destino(s) salvo(s)!${NC}"
  else
    echo -e "  ${YELLOW}⏭ Pulado — use 🎯 Destinos no /menu${NC}"
  fi
  pausar

  # Passo 7 — Origens
  titulo
  echo -e "  ${BOLD}📡 PASSO 7 — Grupos de ORIGEM${NC}\n"
  echo -e "  ${CYAN}[1]${NC} Monitorar TODOS os grupos (padrão)"
  echo -e "  ${CYAN}[2]${NC} Apenas grupos específicos"
  echo -e "  ${CYAN}[3]${NC} Pular — configurar depois pelo /menu ✅\n"
  read -p "  Escolha: " op_orig
  SOURCE_CHAT_IDS=""
  if [ "$op_orig" = "2" ]; then
    read -p "  IDs separados por vírgula: " SOURCE_CHAT_IDS
    echo -e "  ${GREEN}✅ Origens salvas!${NC}"
  elif [ "$op_orig" = "3" ]; then
    echo -e "  ${YELLOW}⏭ Pulado${NC}"
  else
    echo -e "  ${GREEN}✅ Monitorará todos os grupos!${NC}"
  fi
  pausar

  # Passo 8 — Modo
  titulo
  echo -e "  ${BOLD}🔀 PASSO 8 — Modo de encaminhamento${NC}\n"
  echo -e "  ${CYAN}[1]${NC} forward — mostra de onde veio"
  echo -e "  ${CYAN}[2]${NC} copy    — aparece como mensagem nova\n"
  read -p "  Escolha: " op_modo
  FORWARD_MODE="forward"; [ "$op_modo" = "2" ] && FORWARD_MODE="copy"
  pausar

  # Passo 9 — IA (NOVO)
  titulo
  echo -e "  ${BOLD}🧠 PASSO 9 — Inteligência Artificial (opcional)${NC}\n"
  echo -e "  A IA pode reescrever, resumir ou traduzir mensagens antes de encaminhar."
  echo -e "  Você pode ativar/desativar depois pelo /menu → 🧠 IA\n"
  echo -e "  ${CYAN}[1]${NC} Configurar OpenAI (GPT-4o)"
  echo -e "  ${CYAN}[2]${NC} Configurar Gemini"
  echo -e "  ${CYAN}[3]${NC} Configurar ambos"
  echo -e "  ${CYAN}[4]${NC} Pular (sem IA) ✅\n"
  read -p "  Escolha: " op_ia
  OPENAI_API_KEY=""
  GEMINI_API_KEY=""
  case $op_ia in
    1)
      read -p "  OpenAI API Key (sk-...): " OPENAI_API_KEY
      echo -e "  ${GREEN}✅ OpenAI configurada!${NC}"
      ;;
    2)
      read -p "  Gemini API Key: " GEMINI_API_KEY
      echo -e "  ${GREEN}✅ Gemini configurada!${NC}"
      ;;
    3)
      read -p "  OpenAI API Key (sk-...): " OPENAI_API_KEY
      read -p "  Gemini API Key: " GEMINI_API_KEY
      echo -e "  ${GREEN}✅ OpenAI e Gemini configuradas!${NC}"
      ;;
    *)
      echo -e "  ${YELLOW}⏭ IA não configurada — você pode configurar depois${NC}"
      ;;
  esac
  pausar

  # Passo 10 — Admins
  titulo
  echo -e "  ${BOLD}🔐 PASSO 10 — Administradores (opcional)${NC}\n"
  echo -e "  IDs dos usuários que podem controlar este bot."
  echo -e "  ${YELLOW}Deixe em branco para permitir qualquer pessoa.${NC}\n"
  read -p "  ADMIN_IDS (ex: 123456789,987654321): " ADMIN_IDS_INPUT
  pausar

  # Resumo
  titulo
  echo -e "  ${BOLD}📋 RESUMO${NC}\n"
  echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  Container  : ${GREEN}$CONTAINER_NAME${NC}"
  echo -e "  Nome       : ${GREEN}$BOT_NOME${NC}"
  echo -e "  API_ID     : ${GREEN}$API_ID${NC}"
  echo -e "  Destino(s) : ${GREEN}${TARGET_GROUP_ID:-não configurado}${NC}"
  echo -e "  Origens    : ${GREEN}${SOURCE_CHAT_IDS:-todos}${NC}"
  echo -e "  Modo       : ${GREEN}$FORWARD_MODE${NC}"
  echo -e "  OpenAI IA  : ${GREEN}${OPENAI_API_KEY:-(não configurada)}${NC}" | sed "s/sk-[^ ]*/sk-***/"
  echo -e "  Gemini IA  : ${GREEN}${GEMINI_API_KEY:-(não configurada)}${NC}"
  echo -e "  Admins     : ${GREEN}${ADMIN_IDS_INPUT:-qualquer um}${NC}"
  echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  read -p "  Confirmar instalação? [s/N]: " CONF
  [[ ! "$CONF" =~ ^[sS]$ ]] && echo -e "\n  ${YELLOW}Cancelado.${NC}" && pausar && menu_principal && return

  # Instalando
  titulo
  echo -e "  ${BOLD}⚙️  Instalando $CONTAINER_NAME...${NC}\n"
  mkdir -p "$INSTALL_DIR"

  if curl -fsSL "$REPO_RAW/bot.py" -o "$INSTALL_DIR/bot.py" 2>/dev/null; then
    echo -e "  ${GREEN}✅ bot.py baixado do repositório!${NC}"
  elif [ -f "$SCRIPT_DIR/bot.py" ]; then
    cp "$SCRIPT_DIR/bot.py" "$INSTALL_DIR/bot.py"
    echo -e "  ${GREEN}✅ bot.py copiado da pasta local!${NC}"
  else
    echo -e "  ${RED}❌ bot.py não encontrado!${NC}"
    pausar; return
  fi

  cat > "$INSTALL_DIR/.env" << ENVEOF
API_ID=$API_ID
API_HASH=$API_HASH
SESSION_STRING=$SESSION_STRING
BOT_TOKEN=$BOT_TOKEN
BOT_NOME=$BOT_NOME
TARGET_GROUP_ID=$TARGET_GROUP_ID
SOURCE_CHAT_IDS=$SOURCE_CHAT_IDS
FORWARD_MODE=$FORWARD_MODE
ADMIN_IDS=$ADMIN_IDS_INPUT
OPENAI_API_KEY=$OPENAI_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY
CONTAINER_NAME=$CONTAINER_NAME
ENVEOF
  chmod 600 "$INSTALL_DIR/.env"

  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
  echo -e "  🚀 Iniciando container..."

  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -e API_ID="$API_ID" \
    -e API_HASH="$API_HASH" \
    -e SESSION_STRING="$SESSION_STRING" \
    -e BOT_TOKEN="$BOT_TOKEN" \
    -e BOT_NOME="$BOT_NOME" \
    -e TARGET_GROUP_ID="$TARGET_GROUP_ID" \
    -e SOURCE_CHAT_IDS="$SOURCE_CHAT_IDS" \
    -e FORWARD_MODE="$FORWARD_MODE" \
    -e ADMIN_IDS="$ADMIN_IDS_INPUT" \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e GEMINI_API_KEY="$GEMINI_API_KEY" \
    -v "$INSTALL_DIR/bot.py:/app/bot.py:ro" \
    -w /app \
    python:3.12-slim \
    bash -c "pip install telethon aiohttp Pillow -q --root-user-action=ignore && python bot.py" >/dev/null

  echo -e "  ⏳ Aguardando inicialização (15s)..."
  sleep 15

  if docker ps | grep -q "$CONTAINER_NAME"; then
    BOT_USER=$(docker logs "$CONTAINER_NAME" 2>&1 | grep -oP 'Bot: @\S+' | head -1)
    titulo
    echo -e "${GREEN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════════════╗"
    echo "  ║          🎉 BOT INSTALADO COM SUCESSO! 🎉           ║"
    echo "  ╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "  Container : ${GREEN}$CONTAINER_NAME${NC}"
    echo -e "  Bot       : ${CYAN}${BOT_USER:-'ver no Telegram'}${NC}\n"
    echo -e "  ${BOLD}Próximos passos:${NC}"
    echo -e "  1. Adicione ${CYAN}${BOT_USER}${NC} como admin no grupo destino"
    echo -e "  2. Envie ${CYAN}/menu${NC} para o bot"
    echo -e "  3. Use ${CYAN}🧠 IA${NC} no menu para ativar inteligência artificial"
    echo -e "  4. Use ${CYAN}🔎 Descobrir ID${NC} para encontrar IDs facilmente\n"
    [ -n "$OPENAI_API_KEY" ] && echo -e "  ${GREEN}🧠 OpenAI configurada — ative pelo /menu → 🧠 IA${NC}"
    [ -n "$GEMINI_API_KEY" ] && echo -e "  ${GREEN}🧠 Gemini configurada — ative pelo /menu → 🧠 IA${NC}"
    total=$(docker ps --format "{{.Names}}" | grep "^userbot-" | wc -l)
    echo -e "\n  ${YELLOW}Total de bots rodando: $total${NC}"
  else
    echo -e "\n  ${RED}❌ Erro! Logs:${NC}\n"
    docker logs "$CONTAINER_NAME" 2>&1 | tail -20
  fi
  pausar
  menu_principal
}

menu_principal
