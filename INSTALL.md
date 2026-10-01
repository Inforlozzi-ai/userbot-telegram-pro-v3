# Instalação completa — UserBot Telegram Pro v3

Este guia descreve a instalação validada em VPS Ubuntu com Docker, Docker Compose e Traefik.

## 1. Preparar DNS

Descubra o IP público da VPS:

```bash
curl -4 ifconfig.me ; echo
```

No provedor DNS, crie um registro A para o painel apontando para esse IP.

Exemplo:

```text
Tipo: A
Host: painel
Valor: IP_DA_VPS
```

Evite manter CNAME antigo para o mesmo host.

Valide:

```bash
dig +short painel.seudominio.com
```

Se quiser consultar diretamente DNS públicos:

```bash
dig @1.1.1.1 painel.seudominio.com +short
dig @8.8.8.8 painel.seudominio.com +short
```

## 2. Baixar o instalador

Entre como root ou use sudo:

```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/Inforlozzi-ai/userbot-telegram-pro-v3/main/install.sh -o install-userbot.sh
chmod +x install-userbot.sh
```

## 3. Executar

```bash
sudo ./install-userbot.sh
```

O instalador solicitará:

- domínio do painel;
- e-mail do Let's Encrypt;
- senha PostgreSQL (opcional: Enter para gerar);
- JWT Secret (opcional: Enter para gerar);
- Crypto Key (opcional: Enter para gerar);
- diretório de instalação (padrão `/opt/userbot-saas`).

Use o domínio sem `https://` e sem ponto final.

## 4. Rede Docker

Por padrão:

```text
minha_rede
```

Se não existir, será criada automaticamente.

Para escolher outra:

```bash
TRAEFIK_NETWORK=proxy_publica sudo ./install-userbot.sh
```

A mesma variável será gravada no `.env` e usada pelo Docker Compose.

## 5. Traefik existente

O instalador procura um container cujo nome contenha `traefik`.

Se não encontrar, instala uma instância Traefik com HTTP/HTTPS e Let's Encrypt.

Se encontrar:

- mantém o Traefik existente;
- tenta conectá-lo à rede compartilhada quando isso for permitido;
- se estiver em `network_mode: host`, não tenta forçar `docker network connect`;
- uma falha de conexão de rede não encerra mais toda a instalação.

## 6. Deploy

O código será instalado em:

```text
/opt/userbot-saas
```

O script gera `.env`, builda a imagem do bot e executa:

```bash
docker compose up -d --build
```

## 7. Confirmar serviços

```bash
cd /opt/userbot-saas
docker compose ps -a
```

Devem estar ativos:

- `api`;
- `web`;
- `postgres` (healthy);
- `redis`.

Logs:

```bash
docker compose logs --tail=100
```

API:

```bash
docker compose logs -f api
```

Web:

```bash
docker compose logs -f web
```

## 8. Testar domínio e SSL

```bash
curl -I https://painel.seudominio.com
```

Resultado esperado:

```text
HTTP/2 200
```

Se o certificado estiver incorreto:

```bash
TRAEFIK_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i traefik | head -n1)
docker logs "$TRAEFIK_CONTAINER" --since=20m 2>&1 | grep -Ei 'acme|certificate|error|painel.seudominio.com'
```

Um erro ACME `unauthorized` normalmente significa que o domínio ainda apontava para outro IP durante a validação.

## 9. DNS antigo dentro da própria VPS

Compare:

```bash
dig @1.1.1.1 painel.seudominio.com +short
getent ahostsv4 painel.seudominio.com
```

Se o Cloudflare retornar o IP novo e `getent` retornar o antigo:

```bash
resolvectl status
resolvectl dns eth0 1.1.1.1 8.8.8.8
resolvectl flush-caches
getent ahostsv4 painel.seudominio.com
```

## 10. DNS corporativo/local antigo

Se no computador cliente:

```cmd
nslookup painel.seudominio.com
```

retornar IP antigo, mas:

```cmd
nslookup painel.seudominio.com 1.1.1.1
```

retornar o IP correto, o problema está no DNS local/corporativo, não na VPS.

## 11. Acessar

Abra:

```text
https://painel.seudominio.com
```

Depois crie a conta e siga o fluxo do painel.

## 12. Atualizar depois

```bash
cd /opt/userbot-saas
git pull
docker compose up -d --build
docker compose ps
```

## 13. Backup PostgreSQL

```bash
cd /opt/userbot-saas
docker compose exec -T postgres pg_dump -U postgres userbot_saas > backup_$(date +%Y%m%d_%H%M).sql
```

## 14. Observações

A API usa TypeORM com sincronização automática no estado atual do projeto; o script `migration:run` apenas informa que nenhuma migration é necessária.

As integrações Asaas e notificações Telegram podem ficar sem configuração durante o primeiro deploy. Elas devem ser preenchidas no `.env` antes de usar esses recursos.
