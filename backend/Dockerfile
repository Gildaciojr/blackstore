FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY api/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY api/ ./

# Gerar prisma client
RUN npx prisma generate

# Build do NestJS
RUN npm run build

# DEBUG: garantir que dist existe (ESSENCIAL)
RUN ls -la && ls -la dist

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]