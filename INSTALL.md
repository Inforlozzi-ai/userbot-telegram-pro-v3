# 📋 INSTALL.md — Guia completo de instalação

> **Pré-requisitos:** VPS Ubuntu 22.04+, Docker instalado, domínio apontado para o IP da VPS.

---

## 1. Preparar a VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker compose version
```

---

## 2. Clonar o repositório

```bash
git clone https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3.git inforlozzi-saas
cd inforlozzi-saas
```

---

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

### 3.1 Gerar segredos obrigatórios

```bash
# Precisa do Node.js — instale com:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CRYPTO_KEY (32 bytes = 64 chars hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ASAAS_WEBHOOK_TOKEN (token aleatório)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### 3.2 Preencher o .env

| Variável | Como obter |
|---|---|
| `POSTGRES_PASSWORD` | Crie uma senha forte |
| `JWT_SECRET` | Comando acima |
| `CRYPTO_KEY` | Comando acima (64 chars) |
| `ASAAS_API_KEY` | Painel Asaas → API Keys |
| `ASAAS_WEBHOOK_TOKEN` | Comando acima |
| `ASAAS_PLAN_*` | Painel Asaas → Planos → ID |
| `NEXT_PUBLIC_APP_URL` | `https://seudominio.com.br` |

---

## 4. Editar domínio no docker-compose.yml

```bash
# Substituir seudominio.com.br e seu@email.com pelo seus dados reais
sed -i 's/seudominio.com.br/SEUDOMINIO.COM.BR/g' docker-compose.yml
sed -i 's/seu@email.com/SEU@EMAIL.COM/g' docker-compose.yml
```

---

## 5. Subir a stack completa

```bash
docker compose up -d --build
```

Acompanhar logs:
```bash
docker compose logs -f api
docker compose logs -f web
```

Verificar status:
```bash
docker compose ps
```

Saída esperada:
```
NAME       STATUS
postgres   Up (healthy)
redis      Up (healthy)
api        Up
web        Up
traefik    Up
```

---

## 6. Executar migrations do banco

```bash
docker compose exec api npm run typeorm migration:run
```

---

## 7. Configurar webhook Asaas

No painel Asaas → **Configurações → Integrações → Webhooks**:

```
URL:     https://seudominio.com.br/webhooks/asaas
Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, SUBSCRIPTION_INACTIVATED
Token:   (mesmo valor de ASAAS_WEBHOOK_TOKEN no .env)
```

---

## 8. Testar a instalação

```bash
# Criar conta
curl -X POST https://seudominio.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@seudominio.com","password":"minhasenha123"}'

# Login (guarde o access_token retornado)
curl -X POST https://seudominio.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seudominio.com","password":"minhasenha123"}'
```

---

## 9. Acessar o painel

```
https://seudominio.com.br
```

1. Clique em **Criar conta**
2. Faça login
3. Vá em **Meus Bots → + Novo Bot**
4. Siga o wizard: Bot → API → Session → Deploy → Pronto ✅

---

## 🔧 Comandos do dia a dia

```bash
# Ver todos os containers (incluindo bots provisionados)
docker ps -a

# Logs de um bot específico
docker logs userbot-SLUG --tail=50 -f

# Reiniciar a API sem downtime
docker compose restart api

# Atualizar após git pull
git pull && docker compose up -d --build api web

# Backup do banco
docker compose exec postgres pg_dump -U inforlozzi inforlozzi > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_YYYYMMDD.sql | docker compose exec -T postgres psql -U inforlozzi inforlozzi

# Escalar workers de provisionamento
docker compose up -d --scale api=2
```

---

## 🛠 Troubleshooting

| Problema | Solução |
|---|---|
| API não conecta no Postgres | Verificar `DATABASE_URL` e se postgres está healthy |
| Bot não provisiona | Verificar se `/var/run/docker.sock` está montado na API |
| HTTPS não funciona | `dig +short seudominio.com.br` — IP deve bater com a VPS |
| Erro `CRYPTO_KEY must be 32 bytes` | A chave deve ter exatamente **64 chars hexadecimais** |
| Webhook Asaas retorna 401 | `ASAAS_WEBHOOK_TOKEN` no `.env` diferente do cadastrado no Asaas |
| `migration:run` falha | Verificar se `DATABASE_URL` está correto e postgres está up |

---

## 📁 Localização dos arquivos por pacote

```
# Pacote 3 — Provisionamento
apps/api/src/provisioner/docker.service.ts
apps/api/src/provisioner/provisioner.service.ts
apps/api/src/provisioner/provisioner.worker.ts
apps/api/src/provisioner/provisioner.module.ts
apps/api/src/common/crypto.service.ts
apps/api/src/bots/bot.entity.ts
apps/api/src/bots/bots.controller.ts
apps/api/src/billing/webhooks/asaas.webhook.ts
apps/web/components/onboarding/ConnectionWizard.tsx

# Pacote 4 — Dashboard
apps/web/components/dashboard/BotStatusCard.tsx
apps/web/components/dashboard/BotActions.tsx
apps/web/components/dashboard/BotLogs.tsx
apps/web/components/dashboard/BotStatsChart.tsx
apps/web/app/dashboard/bots/page.tsx
apps/web/app/dashboard/bots/[botId]/page.tsx

# Pacote 5 — Auth + Planos
apps/api/src/auth/auth.module.ts
apps/api/src/auth/auth.service.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/auth/jwt.strategy.ts
apps/api/src/auth/jwt-auth.guard.ts
apps/api/src/guards/plan.guard.ts
apps/api/src/users/user.entity.ts
apps/api/src/billing/asaas.service.ts
apps/api/src/billing/upgrade.controller.ts
apps/web/app/login/page.tsx
apps/web/app/register/page.tsx
apps/web/app/dashboard/upgrade/page.tsx
apps/web/hooks/useAuth.ts
```
