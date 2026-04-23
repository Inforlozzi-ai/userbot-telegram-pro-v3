# 🤖 UserBot Telegram Pro v3 — SaaS

> Plataforma completa de revenda de bots Telegram com painel web, autenticação, deploy automático via Docker e IA integrada.

[![Deploy](https://img.shields.io/badge/deploy-Docker-blue)](https://docs.docker.com/)
[![Stack](https://img.shields.io/badge/stack-NestJS%20%7C%20Next.js%20%7C%20Python-green)]()
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação Rápida (1 comando)](#instalação-rápida)
- [Instalação Manual](#instalação-manual)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Usar o Painel](#como-usar-o-painel)
- [Comandos Úteis](#comandos-úteis)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **UserBot Telegram Pro v3** é um SaaS completo que permite:

- ✅ Criar e gerenciar múltiplos bots Telegram via painel web
- ✅ Encaminhar mensagens entre grupos/canais com IA (OpenAI / Gemini)
- ✅ Processar imagens com filtros, logo, texto e borda automaticamente
- ✅ Sistema de revenda — cada cliente tem seu próprio bot em container Docker isolado
- ✅ Autenticação Telegram em 2 etapas via painel (SMS → código → 2FA)
- ✅ Auto-save/restore de configurações entre painel e bot
- ✅ Agendamento, filtros por palavra, tipos de mídia e muito mais

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    VPS / Servidor                    │
│                                                     │
│  ┌─────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ Next.js │    │  NestJS  │    │  PostgreSQL   │  │
│  │  Web    │◄──►│   API    │◄──►│   + Redis     │  │
│  │ :3000   │    │  :3001   │    │               │  │
│  └─────────┘    └──────────┘    └───────────────┘  │
│                      │                              │
│              ┌───────▼────────┐                     │
│              │  Docker SDK    │                     │
│              │  (cria bots)   │                     │
│              └───────┬────────┘                     │
│                      │                              │
│         ┌────────────┼────────────┐                 │
│         ▼            ▼            ▼                 │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│    │ bot-1   │  │ bot-2   │  │ bot-N   │           │
│    │ Python  │  │ Python  │  │ Python  │           │
│    └─────────┘  └─────────┘  └─────────┘           │
│                                                     │
│              ┌──────────────┐                       │
│              │   Traefik    │ (HTTPS automático)    │
│              │  :80 / :443  │                       │
│              └──────────────┘                       │
└─────────────────────────────────────────────────────┘
```

### Stack

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend API | NestJS + Prisma |
| Banco de dados | PostgreSQL 16 |
| Cache/Filas | Redis 7 |
| Bot Telegram | Python 3.12 + Telethon |
| Infra | Docker + Docker Compose + Traefik |
| Reverse Proxy | Traefik v2.11 (HTTPS Let's Encrypt) |

---

## ✅ Pré-requisitos

- **VPS Ubuntu 20.04+** com mínimo 2GB RAM / 2 vCPUs
- **Docker** + **Docker Compose** instalados
- **Domínio** apontando para o IP do servidor (ex: `painel.seudominio.com`)
- **Traefik** rodando na rede `minha_rede` (ou use o script de instalação)
- Portas **80** e **443** abertas no firewall

---

## 🚀 Instalação Rápida

> **1 único comando** — faz tudo automaticamente:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main/install.sh)
```

O script vai:
1. Instalar Docker e Docker Compose (se não tiver)
2. Clonar o repositório
3. Perguntar seus dados (domínio, senhas, etc.)
4. Gerar o `.env` automaticamente
5. Fazer build e subir todos os containers
6. Configurar Traefik com HTTPS automático

---

## 🔧 Instalação Manual

### 1. Clonar o repositório

```bash
git clone https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3.git
cd userbot-telegram-pro-v3
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Preencha todas as variáveis (veja seção [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 3. Verificar rede do Traefik

```bash
# Verificar se a rede existe
docker network ls | grep minha_rede

# Se não existir, criar:
docker network create minha_rede
```

### 4. Build e subir os containers

```bash
docker compose up -d --build
```

### 5. Verificar se está tudo rodando

```bash
docker compose ps
```

Esperando ver todos com status `Up`:
```
NAME                        STATUS
inforlozzi-saas-api-1       Up
inforlozzi-saas-web-1       Up
inforlozzi-saas-postgres-1  Up (healthy)
inforlozzi-saas-redis-1     Up
```

### 6. Criar primeiro usuário admin

```bash
# Acessar o container da API
docker exec -it inforlozzi-saas-api-1 sh

# Dentro do container, rodar seed (se disponível):
npx prisma db seed

# Ou criar via API diretamente:
curl -X POST https://seudominio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seudominio.com","password":"suasenha","name":"Admin"}'
```

---

## ⚙️ Variáveis de Ambiente

Copie o `.env.example` e preencha:

```env
# ── Domínio ───────────────────────────────────────────
DOMAIN=painel.seudominio.com

# ── Banco de dados ────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_forte_aqui
POSTGRES_DB=userbot_saas
DATABASE_URL=postgresql://postgres:senha_forte_aqui@postgres:5432/userbot_saas

# ── JWT / Auth ────────────────────────────────────────
JWT_SECRET=chave_jwt_super_secreta_min32chars
CRYPTO_KEY=chave_crypto_para_auth_interna

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ── Imagem Docker dos bots filhos ────────────────────
DOCKER_IMAGE=inforlozzi/userbot-v3:latest

# ── Rede Docker do Traefik ───────────────────────────
TRAEFIK_NETWORK=minha_rede
```

---

## 🖥️ Como Usar o Painel

### Acesso

Após instalação, acesse: `https://seudominio.com`

### Fluxo de criação de bot

```
1. Login no painel
   └─► Dashboard → Meus Bots → Novo Bot

2. Preencher dados do bot:
   ├─ Nome do bot
   ├─ BOT TOKEN (obtido no @BotFather)
   └─ Autenticar conta Telegram (userbot)
       ├─ Número de telefone
       ├─ Código SMS recebido
       └─ Senha 2FA (se ativada)

3. O painel gera automaticamente a SESSION STRING
   e faz deploy do bot em container Docker isolado

4. Gerenciar via painel:
   ├─ Iniciar / Parar / Reiniciar
   ├─ Ver logs em tempo real
   ├─ Configurar origens e destinos
   ├─ Ativar IA (OpenAI / Gemini)
   └─ Configurar logo e filtros de imagem
```

### Configurar IA no bot

Após o bot estar rodando, abra o chat com o bot no Telegram:

```
/ia → Ativar IA → Escolher provedor (OpenAI / Gemini)
    → Inserir API Key
    → Escolher modo: reescrever / resumir / traduzir / hashtags / etc.
```

### Configurar Logo nas imagens

```
/logo → Enviar imagem PNG (com fundo transparente)
      → Ajustar posição, escala e opacidade
      → Ativar IA de Imagem
```

---

## 🛠️ Comandos Úteis

### Gerenciar containers

```bash
# Ver status de todos os containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs do backend (API)
docker logs -f inforlozzi-saas-api-1

# Logs do frontend
docker logs -f inforlozzi-saas-web-1

# Logs de um bot específico
docker logs -f bot-<uuid>

# Reiniciar apenas a API
docker restart inforlozzi-saas-api-1

# Rebuild após atualização do código
git pull && docker compose up -d --build
```

### Banco de dados

```bash
# Acessar o PostgreSQL
docker exec -it inforlozzi-saas-postgres-1 psql -U postgres -d userbot_saas

# Backup do banco
docker exec inforlozzi-saas-postgres-1 pg_dump -U postgres userbot_saas > backup.sql

# Restaurar backup
cat backup.sql | docker exec -i inforlozzi-saas-postgres-1 psql -U postgres -d userbot_saas
```

### Atualizar o sistema

```bash
cd /opt/userbot-saas   # ou onde você clonou
git pull
docker compose up -d --build
```

---

## 🔍 Troubleshooting

### Container da API não sobe

```bash
docker logs inforlozzi-saas-api-1
```

Problemas comuns:
- `DATABASE_URL` incorreta → verificar `.env`
- Porta 3001 ocupada → `lsof -i :3001`
- Migração do Prisma pendente → `docker exec -it inforlozzi-saas-api-1 npx prisma migrate deploy`

### HTTPS não funciona

```bash
# Verificar se Traefik está na rede correta
docker network inspect minha_rede | grep -A5 traefik

# Ver logs do Traefik
docker logs traefik 2>&1 | grep -i error
```

Problemas comuns:
- Domínio não aponta para o IP correto → verificar DNS
- `certresolver` errado → deve ser `letsencrypt` no `docker-compose.yml`
- Rede incorreta → todos os containers devem estar em `minha_rede`

### Bot filho não conecta ao Telegram

```bash
docker logs bot-<uuid> 2>&1 | tail -30
```

Problemas comuns:
- `SESSION_STRING` inválida → refazer autenticação pelo painel
- `API_ID` / `API_HASH` incorretos → verificar em https://my.telegram.org
- `BOT_TOKEN` expirado → gerar novo no @BotFather

### Erro de autenticação interna (CRYPTO_KEY)

```bash
# Verificar se CRYPTO_KEY está definida
docker exec inforlozzi-saas-api-1 env | grep CRYPTO_KEY

# Deve aparecer a mesma chave nos containers de bot
docker exec bot-<uuid> env | grep CRYPTO_KEY
```

---

## 📁 Estrutura do Projeto

```
userbot-telegram-pro-v3/
├── apps/
│   ├── api/          # Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/         # JWT, login, registro
│   │   │   ├── bots/         # CRUD de bots + deploy Docker
│   │   │   ├── plans/        # Planos de assinatura
│   │   │   └── telegram/     # Autenticação via Telethon
│   │   └── prisma/           # Schema do banco
│   └── web/          # Frontend Next.js
│       └── src/app/
│           ├── bots/         # Páginas de bots
│           ├── admin/        # Painel admin
│           └── auth/         # Login/registro
├── bot.py            # Bot Python (Telethon) — imagem Docker
├── Dockerfile        # Dockerfile do bot Python
├── docker-compose.yml
├── install.sh        # Script de instalação automática
├── .env.example      # Exemplo de variáveis
└── README.md
```

---

## 📞 Suporte

Problemas? Abra uma [Issue](https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3/issues) ou entre em contato.

---

*Desenvolvido por [Inforlozzi-ai](https://github.com/Inforlozzi-ai)*
