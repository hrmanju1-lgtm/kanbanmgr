FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/web/package*.json apps/web/
COPY prisma ./prisma/

RUN npm install
RUN cd apps/api && npm install
RUN cd apps/web && npm install

COPY . .
RUN npx prisma generate
RUN cd apps/web && npm run build

EXPOSE 4000 3000
CMD ["sh", "-c", "npx prisma db push && npx ts-node prisma/seed.ts; cd apps/api & npm run dev & cd /app/apps/web && npm run dev -- --host"]
