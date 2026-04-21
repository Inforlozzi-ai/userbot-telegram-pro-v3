# 📤 Guia: Upload do Projeto para GitHub/GitLab pelo PC

## Opção 1: GitHub (Recomendado)

### Passo 1: Baixar o arquivo

O arquivo `userbot-telegram-pro-v3.zip` já está pronto em `/mnt/user-data/outputs/`

1. Extraia o ZIP em uma pasta local do seu PC:
   ```
   C:\Projetos\userbot-telegram-pro\
   ou
   ~/Projetos/userbot-telegram-pro/
   ```

2. Verifique se os 5 arquivos estão lá:
   ```
   ✅ bot.py
   ✅ install.sh
   ✅ .gitignore
   ✅ LICENSE
   ✅ README.md
   ```

---

### Passo 2: Criar repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Faça login (ou crie conta se não tiver)
3. Clique em **+ (canto superior direito)** → **New repository**
4. Preencha:
   - **Repository name**: `userbot-telegram-pro` (ou seu nome)
   - **Description**: `Gerenciador profissional de userbots Telegram com IA`
   - **Public** ou **Private** (você escolhe)
   - ✅ **Add a README file** — DESMARQUE (você já tem um)
   - ✅ **Add .gitignore** — DESMARQUE (você já tem um)
   - ✅ **Choose a license** — DESMARQUE (você já tem LICENSE)
5. Clique em **Create repository**

---

### Passo 3: Configurar Git no seu PC

Se você nunca usou Git, instale primeiro:

**Windows:**
- Baixe em [git-scm.com](https://git-scm.com/download/win)
- Execute o instalador (use as configurações padrão)

**Mac/Linux:**
```bash
# Mac
brew install git

# Linux (Ubuntu/Debian)
sudo apt-get install git
```

---

### Passo 4: Fazer upload pelo Terminal/PowerShell

Abra o **Terminal** (Mac/Linux) ou **PowerShell** (Windows) e navegue até a pasta:

```bash
cd C:\Projetos\userbot-telegram-pro
# ou
cd ~/Projetos/userbot-telegram-pro
```

Depois execute os comandos (um por um):

```bash
# 1. Inicializar repositório local
git init

# 2. Adicionar seu nome e email (obrigatório)
git config user.name "Seu Nome"
git config user.email "seu.email@example.com"

# 3. Adicionar todos os arquivos
git add .

# 4. Criar primeiro commit
git commit -m "Initial commit: Userbot Telegram PRO v3 com IA e Inline Mode"

# 5. Renomear branch para 'main' (padrão GitHub)
git branch -M main

# 6. Adicionar repositório remoto (substitua SEU_USUARIO e SEU_REPO)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git

# 7. Fazer push (enviar para GitHub)
git push -u origin main
```

**Na primeira vez, você vai precisar:**
- Fazer login com GitHub
- No Windows/Mac: uma janela pop-up aparecerá
- No Linux: será pedido usuário/senha ou token

---

### Passo 5: Verificar upload

Acesse seu repositório no GitHub:
```
https://github.com/SEU_USUARIO/SEU_REPO
```

Você deve ver:
- ✅ bot.py
- ✅ install.sh
- ✅ .gitignore
- ✅ LICENSE
- ✅ README.md

Com a descrição: "Initial commit: Userbot Telegram PRO v3 com IA e Inline Mode"

---

## Opção 2: GitLab

Se preferir GitLab, o processo é idêntico, apenas mude:

```bash
# No Passo 6, use:
git remote add origin https://gitlab.com/SEU_USUARIO/SEU_REPO.git

# E no Passo 7:
git push -u origin main
```

---

## 🔄 Próximos Passos (Atualizar o Repositório)

Se fizer mudanças no código:

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar mudanças
git add .

# 3. Criar commit com mensagem descritiva
git commit -m "Descrição da mudança: ex - Adicionar suporte a Claude API"

# 4. Enviar para GitHub
git push origin main
```

---

## 🎯 Comando Resumido (Copy & Paste)

Se quiser fazer tudo de uma vez, salve em um arquivo `setup.sh` e execute:

**Windows (PowerShell):**
```powershell
cd C:\Projetos\userbot-telegram-pro
git init
git config user.name "Seu Nome"
git config user.email "seu.email@gmail.com"
git add .
git commit -m "Initial commit: Userbot Telegram PRO v3"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

**Mac/Linux:**
```bash
cd ~/Projetos/userbot-telegram-pro
git init
git config user.name "Seu Nome"
git config user.email "seu.email@gmail.com"
git add .
git commit -m "Initial commit: Userbot Telegram PRO v3"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

---

## ⚠️ Erros Comuns

### ❌ "fatal: not a git repository"
**Solução:** Você não está na pasta correta. Use `cd` para entrar na pasta do projeto.

### ❌ "Permission denied (publickey)"
**Solução:** Você não fez login no GitHub. Na primeira vez, uma janela pop-up aparece — faça login lá.

### ❌ "remote: fatal: repository not found"
**Solução:** Verifique se:
- O repositório foi criado no GitHub
- O URL está correto (copie-cole do GitHub)
- Você tem permissão para escrever

### ❌ "Author identity unknown"
**Solução:** Configure seu nome e email:
```bash
git config user.name "Seu Nome"
git config user.email "seu.email@example.com"
```

---

## 📌 Dicas Finais

1. **Crie uma boa descrição** no GitHub:
   ```
   Gerenciador profissional de múltiplos userbots Telegram com IA integrada.
   
   Features:
   - Multi-bot em paralelo
   - IA de Texto (OpenAI + Gemini)
   - IA de Imagem (Logo com posição/escala/opacidade)
   - Inline Mode completo (13 menus)
   - Gerenciador VPS automático
   
   Instale com: sudo bash install.sh
   ```

2. **Adicione badges** no README (status, versão, etc):
   ```markdown
   [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
   [![Python 3.12+](https://img.shields.io/badge/Python-3.12+-green)](https://www.python.org/)
   ```

3. **Use branches** para desenvolvimento:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ... faça mudanças ...
   git push origin feature/nova-funcionalidade
   # Depois faça PR (Pull Request) no GitHub
   ```

4. **Mantenha o repositório atualizado** com versões:
   ```bash
   git tag -a v3.0 -m "Release v3.0 - IA e Inline Mode completo"
   git push origin v3.0
   ```

---

**Pronto! Seu projeto estará público/privado no GitHub/GitLab para sempre!** 🚀

Se tiver dúvidas durante o processo, deixe um comentário. 😊
