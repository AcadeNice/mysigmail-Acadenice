# Étape de build
FROM oven/bun:1 AS builder

WORKDIR /app

# Installation des dépendances
COPY bun.lock package.json ./
RUN bun install

# Build de l'application
COPY . .
RUN bun run build

# Image finale avec Apache et Node.js
FROM oven/bun:1

# Installation d'Apache et curl (pour vérifier le démarrage du serveur)
RUN apt-get update && apt-get install -y apache2 curl && \
    a2enmod rewrite proxy proxy_http headers && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist /var/www/html/
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/public/.htaccess /var/www/html/.htaccess

# Configuration Apache
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ProxyPreserveHost On\n\
    ProxyPass /api http://127.0.0.1:3001/api\n\
    ProxyPassReverse /api http://127.0.0.1:3001/api\n\
    ProxyPass /uploads http://127.0.0.1:3001/uploads\n\
    ProxyPassReverse /uploads http://127.0.0.1:3001/uploads\n\
    ProxyPass /pixel.gif http://127.0.0.1:3001/pixel.gif\n\
    ProxyPassReverse /pixel.gif http://127.0.0.1:3001/pixel.gif\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf && \
    a2ensite 000-default.conf && \
    a2dissite default-ssl

# Script de démarrage
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80 3001

CMD ["/usr/local/bin/docker-entrypoint.sh"]
