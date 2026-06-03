<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-white.png">
    <source media="(prefers-color-scheme: light)" srcset=".github/logo-black.png">
    <img src=".github/logo-black.png" width="100" alt="MySigMail Logo" />
  </picture>
</p>

<h1 align="center">Signatures de mail - AcadéNice</h1>
<p align="center">
  <strong>Générateur de signatures e-mail open source (Gmail, Outlook, Apple Mail, etc.).</strong>
  <br>
  Adaptation francophone avec déploiement Docker et intégration Traefik.
</p>

<p align="center">
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/AcadeNice/signatures-de-mail-acadenice">
  <img alt="Licence AGPL" src="https://img.shields.io/github/license/AcadeNice/signatures-de-mail-acadenice">
</p>

## 🔁 Projet d’origine

Ce dépôt est un fork du projet open source **[MySigMail](https://github.com/antonreshetov/mysigmail)** créé par [Anton Reshetov](https://github.com/antonreshetov) ([AGPL-3.0](https://github.com/antonreshetov/mysigmail/blob/master/LICENSE)).

Ce fork ajoute :

- une documentation en français ;
- un exemple de déploiement Docker/Traefik ;
- quelques ajustements pour stabiliser le build dans un contexte container.

## 📚 Documentations dédiées

- Guide **développeur** : architecture, flux applicatifs et variables d'environnement sont détaillés dans [`docs/README.developpeur.md`](docs/README.developpeur.md).
- Guide **utilisateur** : pas-à-pas pour créer et installer une signature dans [`docs/README.utilisateur.md`](docs/README.utilisateur.md).

## ✨ Fonctionnalités principales

- **Personnalisation** : polices, couleurs, forme de l’avatar, champs personnalisés.
- **Templates prêts à l’emploi** : plusieurs mises en page pour démarrer en quelques clics.
- **Add-ons** : bannière, disclaimer, liens CTA, réseaux sociaux, etc.
- **Sauvegarde locale** : conservation des signatures dans le navigateur.

## 🛠️ Prérequis

### Utilisation locale (Bun)

Si vous souhaitez développer ou tester via Bun :

```bash
git clone https://github.com/AcadeNice/signatures-de-mail-acadenice
cd signatures-de-mail-acadenice
bun install
bun run dev
```

> Bun est nécessaire pour la commande `bun run build`. Installez-le via [bun.sh](https://bun.sh/).

### Variables d’environnement (optionnel)

Pour tester l’upload d’images (S3), créez un fichier `.env` à la racine :

```bash
VITE_AWS_S3_URL=
VITE_AWS_S3_BASKET=
VITE_AWS_S3_ID=
VITE_AWS_S3_KEY=
VITE_AWS_S3_REGION=
```

## 🐳 Déploiement Docker (avec Traefik)

### 1. Vérifier le réseau exposé à Traefik

Identifiez le réseau Docker déjà joint à votre instance Traefik :

```bash
docker network ls
```

Notez son nom puis réutilisez-le dans le fichier de composition. Si aucun réseau dédié n’existe, créez-en un (sur l’hôte où tourne Traefik) et rattachez-y Traefik.

### 2. Préparer le fichier Compose

Le fichier `docker-compose.yml` réel est ignoré par Git. Copiez l’exemple fourni :

```bash
cp docker-compose.example.yml docker-compose.yml
```

Adaptez ensuite :

- le domaine dans `traefik.http.routers.mysigmail.rule` ;
- le nom du réseau dans `traefik.docker.network` et dans la section `networks` ;
- toute variable ou volume spécifique à votre environnement.

### 3. Construire et lancer l’application

```bash
docker compose up -d --build
```

Traefik détecte le service grâce aux labels. Vérifiez le routage (dashboard Traefik, `curl https://votre-domaine`) et la génération du certificat TLS.

### 4. Ajustements facultatifs

- Ajoutez un enregistrement DNS (CNAME ou A) vers votre reverse proxy.
- Si vous utilisez l’upload S3, exportez vos variables dans `.env`.
- Le `Dockerfile` multi-étapes compile l’app avec Bun puis sert le dossier `dist` via Apache.

## 🤝 Contributions

Les contributions sur ce fork sont bienvenues. Merci de conserver :

- la mention du projet original ;
- la licence AGPL-3.0 sur toute redistribution.

## 📬 Ressources

- Discussions et mises à jour : [dépôt amont](https://github.com/antonreshetov/mysigmail).
- Version SaaS officielle : [mysigmail.com](https://mysigmail.com).
- Compte X : [@mysigmail](https://x.com/mysigmail).

## 📄 Licence

Projet sous licence [AGPL-3.0](https://github.com/antonreshetov/mysigmail/blob/master/LICENSE). Toute modification ou redistribution doit conserver cette licence et créditer l’auteur initial.

---

Copyright (c) 2019-présent, [Anton Reshetov](https://github.com/antonreshetov).

Adaptations francophones et guide Docker :
[Signatures de mail - AcadéNice](https://github.com/AcadeNice/signatures-de-mail-acadenice).
