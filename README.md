# 🤖 UserBot Telegram Pro v3 — SaaS

Plataforma SaaS para criar, gerenciar e revender bots Telegram com painel web, API, PostgreSQL, Redis, Docker e HTTPS via Traefik.

## Componentes

- Frontend: Next.js 14
- API: NestJS + TypeORM
- Banco: PostgreSQL 16
- Cache: Redis 7
- Bot: Python + Telethon
- Infra: Docker / Docker Compose
- Proxy reverso: Traefik + Let's Encrypt

## Instalação rápida

### 1. Antes de instalar

Tenha uma VPS Ubuntu com acesso root, Docker (o instalador pode instalar), portas 80/443 liberadas e um domínio/subdomínio apontando para o IP público da VPS.

Confira o IP da VPS:

```bash
curl -4 ifconfig.me ; echo
```

Confira o DNS autoritativo:

```bash
dig +short SEU_DOMINIO
```

Os IPs precisam coincidir antes de o Let's Encrypt emitir o certificado.

### 2. Execute o instalador

A partir da home da VPS:

```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main/install.sh -o install-userbot.sh
chmod +x install-userbot.sh
sudo ./install-userbot.sh
```

Informe somente o domínio, sem `https://`, barra ou ponto final.

Exemplo:

```text
painel.seudominio.com
```

Senha PostgreSQL, JWT Secret e Crypto Key podem ser deixadas em branco para geração automática.

### 3. O instalador faz automaticamente

1. Valida domínio e e-mail.
2. Instala dependências.
3. Instala/verifica Docker e Docker Compose.
4. Cria a rede Docker configurada em `TRAEFIK_NETWORK` quando necessário.
5. Detecta Traefik existente.
6. Suporta Traefik em `network_mode: host` sem abortar a instalação.
7. Clona/atualiza este repositório em `/opt/userbot-saas`.
8. Gera o `.env`.
9. Faz build da imagem do bot.
10. Faz build e deploy de API, Web, PostgreSQL e Redis.
11. Verifica os serviços pelo Docker Compose.
12. Salva credenciais em `/opt/userbot-saas/.credentials`.

## Verificação após instalação

```bash
cd /opt/userbot-saas
docker compose ps -a
```

Esperado:

```text
api       Up
web       Up
postgres  Up (healthy)
redis     Up
```

Logs:

```bash
docker compose logs --tail=100
docker compose logs -f api
docker compose logs -f web
```

Teste HTTPS:

```bash
curl -I https://SEU_DOMINIO
```

Esperado:

```text
HTTP/2 200
```

## Rede Docker / Traefik

A rede padrão é:

```env
TRAEFIK_NETWORK=minha_rede
```

Se ela não existir, o instalador cria.

Para usar outro nome:

```bash
TRAEFIK_NETWORK=proxy_publica sudo ./install-userbot.sh
```

O `docker-compose.yml` lê a mesma variável, evitando divergência entre a rede do instalador e a rede da aplicação.

### Traefik existente em host mode

Algumas VPS já possuem Traefik com `network_mode: host`. Nesse modo o Docker não permite conectar o container a redes adicionais. O instalador detecta essa situação e continua sem interromper o deploy.

## DNS e certificado SSL

Se aparecer:

```text
SSL: no alternative certificate subject name matches target host name
```

confira:

```bash
dig +short SEU_DOMINIO
curl -4 ifconfig.me ; echo
```

Para consultar DNS públicos:

```bash
dig @1.1.1.1 SEU_DOMINIO +short
dig @8.8.8.8 SEU_DOMINIO +short
```

Para ver erros ACME do Traefik:

```bash
TRAEFIK_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i traefik | head -n1)
docker logs "$TRAEFIK_CONTAINER" --since=20m 2>&1 | grep -Ei 'acme|certificate|error|SEU_DOMINIO'
```

Se o DNS autoritativo já estiver correto mas a própria VPS continuar resolvendo um IP antigo:

```bash
resolvectl status
resolvectl dns eth0 1.1.1.1 8.8.8.8
resolvectl flush-caches
getent ahostsv4 SEU_DOMINIO
```

Em redes corporativas, o DNS local também pode manter cache antigo mesmo quando 1.1.1.1 já responde corretamente.

## Variáveis de ambiente

Principais:

```env
DOMAIN=painel.seudominio.com
LETSENCRYPT_EMAIL=admin@seudominio.com

POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha_forte
POSTGRES_DB=userbot_saas
DATABASE_URL=postgresql://postgres:senha_forte@postgres:5432/userbot_saas

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

JWT_SECRET=...
CRYPTO_KEY=...

DOCKER_IMAGE=inforlozzi/userbot-v3:latest
TRAEFIK_NETWORK=minha_rede

NEXTAUTH_URL=https://painel.seudominio.com
NEXTAUTH_SECRET=...
NEXT_PUBLIC_API_URL=https://painel.seudominio.com/api
```

As variáveis Asaas e de notificações são opcionais para subir o painel, mas são necessárias para os respectivos recursos.

## Comandos úteis

```bash
cd /opt/userbot-saas

# status
docker compose ps -a

# logs
docker compose logs -f api
docker compose logs -f web

# reiniciar
docker compose restart api
docker compose restart web

# atualizar
git pull
docker compose up -d --build

# conferir rede
docker network inspect ${TRAEFIK_NETWORK:-minha_rede}
```

## Atualização do sistema

```bash
cd /opt/userbot-saas
git pull
docker compose up -d --build
docker compose ps
```

## Troubleshooting rápido

### Containers aparecem como não iniciados no instalador, mas estão ativos

Use sempre:

```bash
docker compose ps -a
```

A verificação atual já usa os serviços do Compose, sem nomes fixos de container.

### Variáveis Asaas/Telegram aparecem como blank

Avisos como:

```text
ASAAS_API_KEY variable is not set
ASAAS_WEBHOOK_TOKEN variable is not set
NOTIFY_BOT_TOKEN variable is not set
```

não impedem o núcleo do painel de subir. Configure-as quando for ativar billing/notificações.

### Redis avisa sobre vm.overcommit_memory

Opcionalmente:

```bash
sysctl vm.overcommit_memory=1
echo 'vm.overcommit_memory=1' >> /etc/sysctl.conf
```

## Estrutura

```text
.
├── apps/
│   ├── api/
│   └── web/
├── bot.py
├── Dockerfile
├── docker-compose.yml
├── install.sh
├── .env.example
├── QUICKSTART.md
├── INSTALL.md
└── README.md
```

Para um passo a passo operacional mais detalhado, consulte [INSTALL.md](INSTALL.md).
