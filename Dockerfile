FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Railway provides PORT env var
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
