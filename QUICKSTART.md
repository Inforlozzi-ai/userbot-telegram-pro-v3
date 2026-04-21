# ⚡ Quick Start — Userbot Telegram PRO v3

## 📥 Passo 1: Extrair o ZIP

```
userbot-telegram-pro-v3.zip
    ↓
Extrair em:
    C:\Projetos\userbot-telegram-pro
    ou
    ~/Projetos/userbot-telegram-pro
```

---

## 🔧 Passo 2: Enviar para GitHub (2 minutos)

### 2.1 - Criar repositório vazio no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Digite o nome: `userbot-telegram-pro`
3. Deixe **vazio** (não marque nada)
4. Clique **Create repository**

### 2.2 - Copiar o comando que aparece

Você verá algo assim:

```bash
git remote add origin https://github.com/SEU_USER/userbot-telegram-pro.git
git branch -M main
git push -u origin main
```

---

## 💻 Passo 3: Terminal do PC

**Windows: Abra PowerShell**
```
Tecle Windows + R
Digite: powershell
Enter
```

**Mac/Linux: Abra Terminal**
```
Cmd + Space
Digite: terminal
Enter
```

---

## 🚀 Passo 4: Execute (copy & paste)

```bash
cd C:\Projetos\userbot-telegram-pro

git init
git config user.name "Seu Nome"
git config user.email "seu@email.com"
git add .
git commit -m "Initial commit: Userbot Telegram PRO v3 - IA + Inline Mode"
git branch -M main
git remote add origin https://github.com/SEU_USER/userbot-telegram-pro.git
git push -u origin main
```

**Substitua:**
- `Seu Nome` → Seu nome mesmo
- `seu@email.com` → Seu email
- `SEU_USER` → Seu usuário do GitHub

---

## ✅ Pronto!

Seu repositório está online em:
```
https://github.com/SEU_USER/userbot-telegram-pro
```

---

## 📱 Próximo Passo: Instalar na VPS

Agora na sua VPS, execute:

```bash
cd ~ && git clone https://github.com/SEU_USER/userbot-telegram-pro.git
cd userbot-telegram-pro
chmod +x install.sh
sudo bash install.sh
```

---

## 🆘 Erros Comuns

### ❌ "command not found: git"
**Solução:**
- Windows: Reinstale [git-scm.com](https://git-scm.com)
- Mac: `brew install git`
- Linux: `sudo apt install git`

### ❌ "fatal: not a git repository"
**Solução:** Você não está na pasta certa. Verifique com:
```bash
ls
# Deve aparecer: bot.py install.sh README.md LICENSE
```

### ❌ "Permission denied (publickey)"
**Solução:** Faça login quando a janela pop-up aparecer (primeira vez)

---

## 📖 Leitura Completa

Para um guia detalhado, abra:
```
UPLOAD_GUIDE.md
```

Tem tudo explicado passo a passo!

---

**Você consegue! 🎉**
