# ── Dockerfile do bot.py (imagem base para provisionamento) ──
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python
RUN pip install --no-cache-dir \
    telethon \
    aiohttp \
    Pillow \
    openai \
    google-generativeai

# Copiar o bot e aplicar correções de compatibilidade antes da execução
COPY bot.py .
COPY scripts/patch_reply_keyboard.py /tmp/patch_reply_keyboard.py
RUN python /tmp/patch_reply_keyboard.py && rm /tmp/patch_reply_keyboard.py

# Variáveis obrigatórias (passadas no docker run)
ENV API_ID=""
ENV API_HASH=""
ENV SESSION_STRING=""
ENV BOT_TOKEN=""
ENV BOT_NOME="UserBot"
ENV TARGET_GROUP_ID=""
ENV SOURCE_CHAT_IDS=""
ENV FORWARD_MODE="copy"
ENV ADMIN_IDS=""
ENV OPENAI_API_KEY=""
ENV GEMINI_API_KEY=""

CMD ["python", "bot.py"]
