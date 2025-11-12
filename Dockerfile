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

RUN sed -i 's@#LoadModule rewrite_module modules/mod_rewrite.so@LoadModule rewrite_module modules/mod_rewrite.so@' /usr/local/apache2/conf/httpd.conf \
  && sed -i 's/AllowOverride None/    AllowOverride All/' /usr/local/apache2/conf/httpd.conf

COPY --from=builder /app/dist /usr/local/apache2/htdocs/

CMD ["httpd-foreground"]
