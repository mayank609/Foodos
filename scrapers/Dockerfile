FROM mcr.microsoft.com/playwright:v1.41.0-jammy
WORKDIR /app
ENV NODE_ENV=production
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
CMD ["npx", "tsx", "src/index.ts"]
