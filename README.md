# 🤖 Userbot Telegram PRO v3.1

Bot de encaminhamento com IA integrada, sistema de revenda via Docker e controle completo pelo Telegram.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python 3.12+](https://img.shields.io/badge/Python-3.12+-green)
![Telethon](https://img.shields.io/badge/Telethon-Latest-blue)
![Docker](https://img.shields.io/badge/Docker-Required-important)
![Docker Image](https://img.shields.io/badge/Docker%20Image-configurable-informational)

---

## 📋 Funcionalidades

### ✨ Novo em v3.1

- **🧠 IA de Texto expandida** — Modos: reescrever, resumir, traduzir, cortar links, remover menções, uppercase, lowercase, adicionar hashtags, 2 slots de prompt personalizado com nomes editáveis
- **🎨 Efeitos de imagem** — Filtros P&B/vintage/brilho/contraste, sobreposição de texto configurável (cor, tamanho, posição) e borda colorida — acessíveis via submenu `🎨 Efeitos` dentro do menu de imagem
- **🏪 Bot Admin de Revenda** — Comando `/admin` cria e gerencia bots filhos para clientes direto pelo Telegram (deploy automático via Docker)
- **⌨️ Menu fixo na barra de conversa** — Todos os comandos registrados automaticamente via `setMyCommands` ao iniciar
- **💾 Backup e Restore** — `/backup` exporta configuração como `.json`; `/restore` importa pelo chat

### ✅ Base v3

- **🧠 IA de Texto** — OpenAI GPT-4o-mini e Gemini 2.0 Flash
- **🖼 IA de Imagem** — Logo com escala/opacidade/posição configuráveis (Pillow)
- **📱 Inline Mode** — Acesse qualquer menu digitando `@seu_bot` em qualquer chat
- **🎛 13 menus acessíveis** — Painel, Status, IA, Origens, Destinos, Modo, Filtros, Agendamento, Mensagem, Histórico, Descobrir ID, Info, Pausar/Retomar

### ✅ Base v2

- Multi-bot — instale quantos bots quiser em paralelo
- Destinos e origens configuráveis pelo `/menu`
- Modo forward ou copy
- Filtros por palavra (exigir/bloquear)
- Agendamento por horário
- Prefixo e rodapé personalizados
- Filtro por tipo de mídia
- Descobrir ID de usuários, grupos, canais, bots e fóruns
- Estatísticas e histórico
- Modo silencioso
- Regerar Session String sem reinstalar
- Atualizar bot.py sem reinstalar

---

## 🚀 Instalação Rápida

### Pré-requisitos

- **VPS Linux** (Ubuntu 20.04+ ou Debian 10+)
- **Docker** instalado (o script instala automaticamente)
- **Conta Telegram** + API Key em [my.telegram.org](https://my.telegram.org)
- **Bot criado** via [@BotFather](https://t.me/BotFather)

### Comando de Instalação (uma linha)

```bash
cd ~ && rm -rf userbot-telegram-pro-v3 && git clone https://github.com/Inforlozzi-ai/userbot-telegram-pro-v3.git && cd userbot-telegram-pro-v3 && chmod +x install.sh && sudo bash install.sh
```

Ou se já tem a pasta:

```bash
cd ~/userbot-telegram-pro-v3 && sudo bash install.sh
```

### O que acontece durante a instalação

1. **Docker** é instalado (se necessário)
2. **Nome do bot** único para identificar na VPS
3. **Chaves de API do Telegram** (opção para usar padrão Inforlozzi ou própria)
4. **Session String** gerada interativamente (faz login na sua conta Telegram)
5. **BOT TOKEN** do @BotFather
6. **Destinos e Origens** (configuráveis depois pelo `/menu`)
7. **Modo de encaminhamento** (forward ou copy)
8. **IA** — OpenAI e/ou Gemini (opcional, ativa depois pelo menu)
9. **Administradores** — IDs de usuários que podem controlar o bot

---

## 🎮 Como Usar

### Comandos do Bot

Os comandos aparecem automaticamente na barra de conversa (sem precisar digitá-los).

```
/start      — Boas-vindas e instruções
/menu       — Abre o painel de controle
/status     — Estado atual e estatísticas
/ia         — Configurar IA (texto + imagem)
/logo       — Enviar logo PNG para sobreposição em fotos
/admin      — Painel de revenda (só para admins)
/backup     — Exportar configuração como .json
/restore    — Importar configuração via .json no chat
```

### 📱 Inline Mode — Acesso via Campo de Mensagem

Digite `@seu_bot` seguido de uma palavra-chave **em qualquer chat**:

```
@seu_bot menu          → Painel principal
@seu_bot ia            → IA de texto e imagem
@seu_bot origem        → Gerenciar grupos monitorados
@seu_bot destino       → Gerenciar grupos de envio
@seu_bot modo          → Forward/Copy, Delay, Tipos de mídia
@seu_bot filtro        → Palavras exigidas/bloqueadas
@seu_bot horario       → Agendamento por hora
@seu_bot mensagem      → Prefixo e rodapé
@seu_bot historico     → Últimas mensagens encaminhadas
@seu_bot id            → Descobrir ID de grupos/canais/usuários
@seu_bot status        → Estatísticas
@seu_bot info          → Ping, ID do chat, testar destinos
@seu_bot pausa         → Pausar/Retomar encaminhamento
```

Todos os resultados inline têm botões funcionais — você navega como no `/menu`.

---

## 🧠 Inteligência Artificial

### IA de Texto

Processa todo texto encaminhado antes de reenviar.

**Modos disponíveis:**
- **Reescrever** — Reformula o texto mantendo o sentido
- **Resumir** — Reduz a 1-2 frases essenciais
- **Traduzir** — Para português do Brasil
- **Cortar links** — Remove URLs do texto
- **Remover menções** — Remove @usuário do texto
- **Uppercase / Lowercase** — Converte capitalização
- **Adicionar hashtags** — Gera e insere hashtags relevantes
- **Prompt 1 / Prompt 2** — Dois slots de prompt personalizados com nomes editáveis

**Provedores:**
- **OpenAI** — GPT-4o-mini
- **Gemini** — Gemini 2.0 Flash

### IA de Imagem

Aplica sua logo e efeitos automaticamente em toda foto encaminhada.

**Como configurar a logo:**
1. Envie `/logo` → mande sua imagem PNG com fundo transparente
2. Vá em `/ia` → `🖼 Config Imagem`
3. Escolha posição (↖ ↗ ↙ ↘ ⊕), escala (1–80%) e opacidade (0–100%)
4. Use `📷 Testar com foto` para visualizar antes de ativar
5. Ative `[IA IMG: ATIVA]`

**Efeitos disponíveis (submenu 🎨 Efeitos):**
- **Filtros**: P&B, vintage, brilho, contraste
- **Texto na imagem**: sobreposição com cor, tamanho e posição configuráveis
- **Borda colorida**: cor e espessura configuráveis

---

## 🎛 Painel de Controle (`/menu`)

### Linha 1: Configuração Base
- **🔊 Origens** — Quais grupos monitorar (todos ou específicos)
- **🎯 Destinos** — Onde encaminhar as mensagens
- **🔀 Modo** — Forward (mostra origem) ou Copy (nova mensagem)

### Linha 2: Processamento
- **🔍 Filtros** — Exigir/bloquear palavras antes de enviar
- **⏰ Horário** — Janela de funcionamento (ex: 08:00 até 18:00)
- **💬 Mensagem** — Prefixo/rodapé (ex: "Repostado de X")

### Linha 3: Monitoramento
- **📊 Status** — Estado e estatísticas atualizadas
- **📋 Histórico** — Últimas 15 mensagens encaminhadas
- **ℹ️ Info** — Ping, ID do chat, testar conexão com destinos

### Linha 4: IA + ID
- **🧠 IA** — Painel de IA (texto + imagem + efeitos)
- **🔎 Descobrir ID** — Encontrar IDs de grupos, canais, usuários

### Linha 5: Controle
- **⏸ Pausar / ▶ Retomar** — Pausar encaminhamento temporariamente
- **🔔 Silencioso** — Desativar logs (útil em produção)
- **❌ Fechar** — Deletar a mensagem do menu

---

## 🏪 Sistema de Revenda

O comando `/admin` permite criar e gerenciar bots filhos para clientes ou revendedores, tudo pelo Telegram, sem acesso direto à VPS.

**Disponível apenas para usuários na lista de admins.**

### Como criar um bot filho

1. Envie `/admin` no chat do seu bot principal
2. Escolha `➕ Novo bot`
3. Informe:
   - **Nome**: identificador único na VPS (ex: `clienteabc`)
   - **BOT_TOKEN**: token do bot do cliente (via @BotFather)
   - **SESSION**: Session String da conta Telegram do cliente
4. O bot é criado e iniciado automaticamente via Docker na mesma VPS

### Gerenciar bots filhos

No painel `/admin`, para cada bot filho:

```
▶️  Iniciar
⏹  Parar
🔄  Reiniciar
📋  Ver logs (últimas 30 linhas)
🗑  Deletar (remove container e arquivos)
```

### Variável de ambiente

A variável `DOCKER_IMAGE` no `.env` do bot principal define qual imagem Docker é usada no deploy dos bots filhos:

```env
DOCKER_IMAGE=seu-usuario/userbot-telegram-pro:latest
```

---

## 💾 Backup e Restore

### `/backup`

Exporta toda a configuração atual do bot como arquivo `.json` e envia direto no chat.

O arquivo inclui: origens, destinos, modo, filtros, agendamento, prefixo/rodapé, configurações de IA e efeitos de imagem.

### `/restore`

Envia o comando `/restore` e em seguida envie o arquivo `.json` gerado pelo `/backup`.

O bot importa todas as configurações automaticamente, sem necessidade de reconfigurar pelo menu.

**Útil para:** migrar entre VPS, fazer cópia antes de atualizar, restaurar configuração após reinstalação.

---

## 🛠 Menu da VPS (`sudo bash install.sh`)

```
[1] 🆕 Instalar novo bot
[2] 📋 Gerenciar bots
[3] 🗑  Desinstalar bot
[4] 📊 Ver logs em tempo real
[5] 🔁 Regerar Session String de um bot
[6] 🔄 Atualizar bot.py (baixar versão mais recente)
[7] 🧠 Configurar IA de um bot (OpenAI / Gemini)
[8] 🧹 Limpar tudo (todos os bots)
[9] ❌ Sair
```

### Gerenciar Bots `[2]`

```
[1] 📋 Ver logs (últimas 30 linhas)
[2] 🔄 Reiniciar
[3] ⏹  Parar
[4] ▶️  Iniciar
[5] 🔍 Inspecionar variáveis
[6] 🧠 Configurar IA deste bot
[7] ⬅️  Voltar
```

---

## 📐 Estrutura do Projeto

```
userbot-telegram-pro/
├── bot.py              # Código principal (~1600 linhas)
├── install.sh          # Script de instalação & gerenciador VPS
├── .gitignore
├── LICENSE
├── README.md
└── /opt/
    └── userbot-<nome>/
        ├── .env        # Variáveis de ambiente
        └── bot.py
```

---

## 🔐 Segurança

- **Session String** armazenada em variáveis de ambiente (Docker)
- **API Keys** (OpenAI/Gemini) não salvas em arquivo — apenas em memória
- **Arquivos .env** têm permissão 600 (somente leitura pelo owner)
- **Código montado como volume read-only** — impossível modificar durante execução
- **.gitignore** previne commit acidental de credenciais

---

## 🐳 Requisitos de Sistema

- **CPU**: 0.5 cores (mínimo por bot)
- **RAM**: 256 MB por bot (recomendado 512 MB+)
- **Disco**: 500 MB por bot (imagens temporárias em memória)
- **Largura de banda**: depende do volume de mensagens

---

## 📊 Estatísticas

O bot rastreia automaticamente:

- **Enviadas** — Total de mensagens encaminhadas com sucesso
- **Erros** — Tentativas de envio que falharam
- **Uptime** — Tempo de execução contínua
- **Por hora** — Distribuição de mensagens por hora do dia
- **Histórico** — Últimas 200 mensagens com timestamp

Visualize em `/menu` → `📊 Status`.

---

## 🆘 Troubleshooting

### Bot não inicia

```bash
# Ver logs detalhados
docker logs userbot-seubot

# Reiniciar
docker restart userbot-seubot

# Verificar se o container existe
docker ps -a
```

### Session String inválida

```bash
sudo bash install.sh
# Escolha [5] Regerar Session String
# Faça login novamente no Telegram
```

### IA não funciona

1. Verifique se a API Key foi salva: `/ia` → Ver config
2. Teste com uma mensagem: `/ia` → Testar Texto
3. Verifique logs: `docker logs userbot-seubot | grep "[IA]"`

### Logo não aparece em fotos

1. Confirme que Pillow está instalado: `docker logs userbot-seubot | grep "Pillow"`
2. Confirme que a logo foi enviada: `/ia` → Config Imagem → Ver logo
3. Teste: `/ia` → Config Imagem → Testar com foto
4. Ative: `[IA IMG: ATIVA]`

### Bot filho não inicia (revenda)

1. Verifique se `DOCKER_IMAGE` está definido no `.env` do bot principal
2. Confirme que o BOT_TOKEN e a SESSION informados são válidos
3. Veja os logs do bot filho: `/admin` → selecionar bot → `📋 Ver logs`
4. Verifique se há conflito de nome: dois bots com o mesmo identificador não podem coexistir
5. Confirme que a VPS tem memória suficiente para mais um container

### Backup/Restore com erro

- O arquivo `.json` deve ser enviado diretamente no chat após o comando `/restore`, sem texto adicional
- Se a importação falhar, verifique se o arquivo não foi corrompido (abra e veja se é um JSON válido)

---

## 🚀 Upgrade Futuro

- [ ] Dashboard web para gerenciamento
- [ ] Banco de dados para persistência
- [ ] Webhook para integração com outros serviços
- [ ] Detecção de duplicatas (não enviar mensagem 2x)
- [ ] Multi-idioma na UI
- [ ] Remoção de logos existentes (detecção IA)
- [ ] Suporte a Claude API para IA de texto

---

## 📝 Changelog

### v3.1 (Atual)
- IA de Texto: novos modos cortar links, remover menções, uppercase, lowercase, hashtags, 2 prompts personalizados com nome editável
- IA de Imagem: filtros P&B/vintage/brilho/contraste, sobreposição de texto (cor/tamanho/posição), borda colorida — via submenu `🎨 Efeitos`
- `/admin`: criação e gerenciamento de bots filhos para revenda, com deploy automático via Docker
- Menu fixo na barra de conversa: comandos registrados via `setMyCommands` ao iniciar
- `/backup` e `/restore`: exportação e importação de configuração como `.json`

### v3.0
- Inline Mode completo com 13 menus
- IA de Texto (OpenAI + Gemini)
- IA de Imagem (logo com escala/opacidade/posição via Pillow)
- Menu de IA integrado na instalação VPS
- Busca inteligente no inline mode

### v2
- Multi-bot core
- Modos forward e copy
- Filtros por palavra
- Agendamento por hora
- Descobrir ID
- Painel inline básico

### v1
- Primeiro release
- Encaminhamento simples

---

## 💬 Suporte & Contribuições

Issues e PRs são bem-vindos.

Para relatar um bug:
1. Colete os logs: `docker logs userbot-seubot > log.txt`
2. Descreva o comportamento esperado vs. o que aconteceu
3. Abra uma issue com os detalhes

---

## 📜 Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

Você pode usar, modificar e distribuir, desde que mantenha a atribuição ao autor original.

---

## 🙏 Agradecimentos

- [Telethon](https://github.com/LonamiWebs/Telethon) — Biblioteca Telegram para Python
- [Pillow](https://python-pillow.org/) — Processamento de imagens
- [OpenAI](https://openai.com/) — ChatGPT API
- [Google Gemini](https://google.ai) — Gemini API

---

*Última atualização: Maio 2025 | v3.1*
