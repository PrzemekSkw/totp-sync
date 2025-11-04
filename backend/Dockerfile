FROM node:20

# Zainstaluj sqlite3 dla Debian
RUN apt-get update && \
    apt-get install -y sqlite3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Stwórz użytkownika nodejs (Debian style)
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nodejs && \
    mkdir -p /data && \
    chown -R nodejs:nodejs /app /data

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
