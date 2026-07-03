FROM node:20-slim

# nmap is required for the port scan module
RUN apt-get update && \
    apt-get install -y --no-install-recommends nmap ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
