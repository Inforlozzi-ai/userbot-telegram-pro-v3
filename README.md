# 🤖 Inforlozzi SaaS — Bot Telegram Platform

Plataforma SaaS completa para criação, gerenciamento e revenda de bots Telegram com IA integrada.

**Stack:** Python (bot) · NestJS (API) · Next.js (painel web) · PostgreSQL · Redis · Docker

---

## 📦 Estrutura do Projeto

```
inforlozzi-saas/
├── bot/                    # Bot Python (Telethon) — já existente
│   └── bot.py
├── apps/
│   ├── api/                # Backend NestJS
│   │   └── src/
│   │       ├── auth/           # JWT, login, register
│   │       ├── users/          # Entidade User
│   │       ├── bots/           # CRUD bots + controller
│   │       ├── provisioner/    # Docker + BullMQ
│   │       ├── billing/        # Asaas checkout
│   │       └── common/         # CryptoService
│   └── web/                # Frontend Next.js
│       ├── app/
│       │   ├── login/
│       │   ├── register/
│       │   ├── dashboard/
│       │   │   ├── bots/
│       │   │   │   ├── page.tsx            # Lista de bots
│       │   │   │   ├── novo/page.tsx       # ConnectionWizard
│       │   │   │   └── [botId]/page.tsx    # Dashboard individual
│       │   │   └── upgrade/page.tsx        # Planos
│       │   └── api/            # Proxy routes Next.js
│       ├── components/dashboard/
│       │   ├── BotStatusCard.tsx
│       │   ├── BotActions.tsx
│       │   ├── BotLogs.tsx
│       │   └── BotStatsChart.tsx
│       ├── components/onboarding/
│       │   └── ConnectionWizard.tsx
│       └── hooks/
│           └── useAuth.ts
├── docker-compose.yml      # Stack completa
├── .env.example
└── INSTALL.md              # ← Guia de instalação
```

---

## 🚀 Pacotes entregues

| # | Pacote | Conteúdo |
|---|---|---|
| 1 | Landing page | HTML/CSS estático |
| 2 | Schema DB + estrutura | TypeORM, migrations |
| 3 | Provisionamento | Docker, BullMQ, Wizard, Webhook Asaas |
| 4 | Dashboard | Status, Logs, Gráfico, Lista de bots |
| 5 | Auth + Planos | JWT, bcrypt, guard de plano, checkout Asaas |
| 6 | Revendedor | *em breve* |

---

Leia o **[INSTALL.md](./INSTALL.md)** para o passo a passo completo de instalação.
