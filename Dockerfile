# Étape de build
FROM oven/bun:1 AS builder

WORKDIR /app

# Installation des dépendances
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Build de l'application
COPY . .
RUN bun run build

# Serveur Apache2
FROM httpd:alpine

COPY --from=builder /app/dist /usr/local/apache2/htdocs/

CMD ["httpd-foreground"]
