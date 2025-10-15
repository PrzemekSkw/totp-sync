FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package
COPY package*.json ./

# Instaluj zależności - zmień npm ci na npm install
RUN npm install --production

# Kopiuj kod źródłowy
COPY . .

# Użytkownik bez uprawnień root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Healthcheck
#HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
