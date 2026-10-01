# Quick Start — UserBot Telegram Pro v3

## VPS nova

### 1. Aponte o domínio para a VPS

```bash
curl -4 ifconfig.me ; echo
dig +short painel.seudominio.com
```

Os IPs devem ser iguais.

### 2. Instale

```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main/install.sh -o install-userbot.sh
chmod +x install-userbot.sh
sudo ./install-userbot.sh
```

### 3. Valide

```bash
cd /opt/userbot-saas
docker compose ps -a
curl -I https://painel.seudominio.com
```

Esperado: `api`, `web`, `postgres` e `redis` ativos e HTTPS respondendo `HTTP/2 200`.

## Atualizar instalação existente

```bash
cd /opt/userbot-saas
git pull
docker compose up -d --build
docker compose ps
```

## Se o SSL falhar

```bash
dig @1.1.1.1 painel.seudominio.com +short
curl -4 ifconfig.me ; echo
TRAEFIK_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i traefik | head -n1)
docker logs "$TRAEFIK_CONTAINER" --since=20m 2>&1 | grep -Ei 'acme|certificate|error'
```

Guia completo: [INSTALL.md](INSTALL.md).
