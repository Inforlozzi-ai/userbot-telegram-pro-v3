FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar Python3 e Telethon para o script de autenticacao
RUN apk add --no-cache python3 py3-pip && \
    pip3 install telethon --break-system-packages

RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

EXPOSE 3001
CMD ["node", "dist/main"]
