# 🤖 Userbot Telegram PRO v3

**Gerenciador profissional de múltiplos userbots de encaminhamento com IA integrada.**

Monitore grupos de origem, encaminhe mensagens para destinos com transformações inteligentes (IA), aplique logos em imagens, customize mensagens com prefixo/rodapé e muito mais — tudo via interface intuitiva no Telegram.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python 3.12+](https://img.shields.io/badge/Python-3.12+-green)
![Telethon](https://img.shields.io/badge/Telethon-Latest-blue)
![Docker](https://img.shields.io/badge/Docker-Required-important)

---

## 📋 Funcionalidades v3

### ✨ Novo em v3

- **🧠 IA de Texto** — Reescrever, resumir, traduzir mensagens com OpenAI/Gemini
- **🖼 IA de Imagem** — Sobrepor sua logo em fotos encaminhadas (Pillow)
- **📱 Inline Mode Completo** — Acesse qualquer menu digitando `@seu_bot` no chat
- **🎛 13 Menus acessíveis** — Painel, Status, IA, Origens, Destinos, Modo, Filtros, Agendamento, Mensagem, Histórico, Descobrir ID, Info, Pausar/Retomar
- **🔄 Configuração de IA na VPS** — Menu dedicado para OpenAI e Gemini durante instalação
- **💾 Pillow integrado** — Processamento de imagem automático (sem liberar memória entre encaminhamentos)

### ✅ Base v2

- Multi-bot — instale quantos bots quiser em paralelo
- 🎯 Destinos e origens configuráveis pelo `/menu`
- 🔀 Modo forward ou copy
- 🔍 Filtros por palavra (exigir/bloquear)
- ⏰ Agendamento por horário
- ✏️ Prefixo e rodapé personalizados
- 📁 Filtro por tipo de mídia
- 🔎 Descobrir ID de usuários, grupos, canais, bots e fóruns
- 📊 Estatísticas e histórico
- 🔕 Modo silencioso
- 🔁 Regerar Session String sem reinstalar
- 🔄 Atualizar bot.py sem reinstalar

---

## 🚀 Instalação Rápida

### Pré-requisitos

- **VPS Linux** (Ubuntu 20.04+ ou Debian 10+)
- **Docker** instalado (o script instala automaticamente)
- **Conta Telegram** + API Key em [my.telegram.org](https://my.telegram.org)
- **Bot criado** via [@BotFather](https://t.me/BotFather)

### Comando de Instalação (uma linha)

```bash
cd ~ && rm -rf ~/userbot-telegram-pro && git clone https://github.com/Inforlozzi-ai/userbot-telegram-pro.git && cd ~/userbot-telegram-pro && chmod +x install.sh && sudo bash install.sh
```

Ou se já tem a pasta:

```bash
cd ~/userbot-telegram-pro && sudo bash install.sh
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

### Comandos Básicos do Bot

Mande no chat do seu bot (depois de adicioná-lo como admin):

```
/start      — Boas-vindas e instruções
/menu       — Abre o painel de controle completo
/status     — Ver estado atual e estatísticas
/ia         — Configurar inteligência artificial (OpenAI/Gemini)
/logo       — Enviar logo PNG para substituir/sobrepor em fotos
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

Todos os resultados inline têm botões completamente funcionais — você navega como se estivesse no `/menu`.

---

## 🧠 Inteligência Artificial — v3

### IA de Texto

Processa **todo texto** encaminhado antes de reenviar.

**Modos:**
- **Reescrever** — Deixa mais claro e profissional
- **Resumir** — Reduz a 1-2 frases essenciais
- **Traduzir** — Para português do Brasil
- **Personalizado** — Seu próprio prompt

**Provedores:**
- **OpenAI** — GPT-4o-mini (rápido, preciso)
- **Gemini** — Gemini 2.0 Flash (versátil, econômico)

### IA de Imagem

Sobrepõe sua logo **automaticamente** em toda foto encaminhada.

**Como configurar:**
1. Envie `/logo` → mande sua imagem PNG com fundo transparente
2. Vá em `/ia` → `🖼 Config Imagem`
3. Escolha:
   - **Posição**: ↖ Superior Esquerdo, ↗ Superior Direito, ↙ Inferior Esquerdo, ↘ Inferior Direito, ⊕ Centro
   - **Escala**: 1-80% da largura da imagem
   - **Opacidade**: 0-100% (0 = transparente, 100 = sólida)
4. **"📷 Testar com foto"** para visualizar antes
5. Ative **"IA IMG: ATIVA"**

A partir daí toda foto recebe sua logo automaticamente.

---

## 🎛 Painel de Controle (`/menu`)

### Linha 1: Configuração Base
- **🔊 Origens** — Quais grupos monitorar (todos ou específicos)
- **🎯 Destinos** — Onde encaminhar as mensagens
- **🔀 Modo** — Forward (mostra origem) ou Copy (nova mensagem)

### Linha 2: Processamento
- **🔍 Filtros** — Exigir/bloquear palavras antes de enviar
- **⏰ Horário** — Janela de funcionamento (ex: 08:00 até 18:00)
- **💬 Mensagem** — Adicionar prefixo/rodapé (ex: "Repostado de X")

### Linha 3: Monitoramento
- **📊 Status** — Estado e estatísticas atualizadas
- **📋 Histórico** — Últimas 15 mensagens encaminhadas
- **ℹ️ Info** — Ping, ID do chat, testar conexão com destinos

### Linha 4: IA + ID
- **🧠 IA** — Abrir painel de IA (texto + imagem)
- **🔎 Descobrir ID** — Encontrar IDs de grupos, canais, usuários

### Linha 5: Controle
- **⏸ Pausar / ▶ Retomar** — Pausar encaminhamento temporariamente
- **🔔 Silencioso** — Desativar logs (útil em produção)
- **❌ Fechar** — Deletar a mensagem do menu

---

## 🛠 Menu da VPS (`sudo bash install.sh`)

Após a primeira instalação, abra o menu principal:

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
├── bot.py              # Código principal (1265 linhas)
├── install.sh          # Script de instalação & gerenciador VPS
├── .gitignore          # Git ignore
├── LICENSE             # MIT License
├── README.md           # Este arquivo
└── /opt/               # Diretório criado na VPS durante instalação
    └── userbot-<nome>/
        ├── .env        # Variáveis de ambiente (seguro)
        └── bot.py      # Cópia do código (montado como volume)
```

---

## 🔐 Segurança

- **Session String** armazenada em variáveis de ambiente (Docker)
- **API Keys** (OpenAI/Gemini) **NÃO salvas em arquivo** — apenas em memória
- **Arquivos .env** têm permissão 600 (somente leitura pelo owner)
- **Código montado como volume read-only** — impossível modificar durante execução
- **.gitignore** previne commit de credenciais acidentais

---

## 🐳 Requisitos de Sistema

- **CPU**: 0.5 cores (mínimo)
- **RAM**: 256 MB por bot (recomendado 512 MB+)
- **Disco**: 500 MB por bot (imagens temporárias em memória)
- **Largura de banda**: Depende do volume de mensagens

---

## 🆘 Troubleshooting

### Bot não inicia

```bash
# Ver logs detalhados
docker logs userbot-seubot

# Reiniciar
docker restart userbot-seubot

# Verificar se Docker está rodando
docker ps -a
```

### Session String inválida

```bash
# Abra o menu VPS
sudo bash install.sh

# Escolha [5] Regerar Session String
# Faça login novamente no Telegram
```

### IA não funciona

1. Verifique se a API Key foi salva: `/ia` → Ver config
2. Testee com uma mensagem: `/ia` → Testar Texto
3. Verifique logs: `docker logs userbot-seubot | grep "\[IA\]"`

### Logo não aparece em fotos

1. Verifique se Pillow está instalado: `docker logs | grep "Pillow"`
2. Confirme logo foi enviada: `/ia` → Config Imagem → Ver logo
3. Teste com foto: `/ia` → Config Imagem → Testar com foto
4. Ative IA de Imagem: `[✅ IA IMG: ATIVA]`

---

## 📊 Estatísticas

O bot rastreia automaticamente:

- ✉️ **Enviadas** — Total de mensagens encaminhadas com sucesso
- ⚠️ **Erros** — Tentativas de envio que falharam
- ⏱️ **Uptime** — Tempo de execução contínua
- 📈 **Por hora** — Distribuição de mensagens por hora do dia
- 📋 **Histórico** — Últimas 200 mensagens com timestamp

Visualize em `/menu` → `📊 Status`.

---

## 🚀 Upgrade Futuro

Este projeto está em desenvolvimento contínuo. Possíveis upgrades:

- [ ] Dashboard web para gerenciamento
- [ ] Banco de dados para persistência
- [ ] Webhook para integração com outros serviços
- [ ] Detecção de duplicatas (não enviar mensagem 2x)
- [ ] Backup automático de configs
- [ ] Multi-idioma na UI
- [ ] Remoção de logos existentes (detecção IA)
- [ ] Suporte a Claude API para IA de texto

---

## 📝 Changelog

### v3 (Atual)
- ✨ Inline Mode completo com 13 menus
- 🧠 IA de Texto (OpenAI + Gemini)
- 🖼 IA de Imagem (Pillow — logo com escala/opacidade/posição)
- 🔧 Menu de IA integrado na instalação VPS
- 📱 Busca inteligente no inline mode
- 🎨 Interface aprimorada com emojis

### v2
- Multi-bot core
- Forward/Copy modes
- Filtros por palavra
- Agendamento por hora
- Descobrir ID
- Painel inline básico

### v1
- Primeiro release
- Encaminhamento simples

---

## 💬 Suporte & Contribuições

**Issues & PRs são bem-vindos!**

Para relatar um bug:
1. Colete os logs: `docker logs userbot-seubot > log.txt`
2. Descreva o comportamento esperado vs. atual
3. Abra uma issue com os detalhes

---

## 📜 Licença

Este projeto está sob a **licença MIT** — veja [LICENSE](LICENSE) para detalhes.

Resumo: você é livre para usar, modificar e distribuir, desde que mencione o autor original e não se responsabilize.

---

## 🙏 Agradecimentos

- [Telethon](https://github.com/LonamiWebs/Telethon) — Biblioteca Telegram para Python
- [Pillow](https://python-pillow.org/) — Processamento de imagens
- [OpenAI](https://openai.com/) — ChatGPT API
- [Google Gemini](https://google.ai) — Gemini API
- Comunidade de developers que usa e contribui

---

**Feito com ❤️ para automação de Telegram.**

*Última atualização: Abril 2025 | v3.0*
