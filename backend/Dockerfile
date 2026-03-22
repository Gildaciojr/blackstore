FROM node:20-alpine

WORKDIR /app

COPY api/package*.json ./

RUN npm install

COPY api .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]