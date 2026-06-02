FROM node:18-alpine

RUN apk add --no-cache openssl

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
RUN cd apps/api && npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node apps/api/dist/server.js"]
