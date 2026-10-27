
# ==========================================
# MOTO STORE - BACKEND
# Node.js + Express + Prisma + PostgreSQL
# ==========================================

FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias necesarias para Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Node.js
COPY package*.json ./

RUN npm ci

# Copiar esquema, migraciones y configuracion de Prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# URL temporal exclusivamente para generar Prisma Client
# No se conecta a ninguna base de datos real
RUN DATABASE_URL="postgresql://usuario:clave@localhost:5432/moto_store_build" \
    npx prisma generate

# Copiar codigo del backend
COPY server.js ./
COPY routes ./routes
COPY controllers ./controllers
COPY services ./services
COPY middlewares ./middlewares
COPY tests ./tests

# Entorno de produccion
ENV NODE_ENV=production

EXPOSE 3000

# Al iniciar, Render utilizara DATABASE_URL de su entorno
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
