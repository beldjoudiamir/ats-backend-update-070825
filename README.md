# ATS Backend

Backend API pour le système ATS (Automated Transport System).

## Structure du projet

```
atsbackend070825/
├── src/                    # Code source principal
│   ├── config/            # Configuration de la base de données
│   ├── controllers/       # Contrôleurs pour la logique métier
│   ├── routes/           # Définition des routes API
│   ├── utils/            # Utilitaires et middleware
│   └── server.js         # Point d'entrée de l'application
├── Json/                 # Fichiers JSON d'exemple
├── uploads/              # Dossier pour les fichiers uploadés
└── package.json          # Dépendances et scripts
```

## Installation

```bash
# Installer les dépendances
yarn install

# Démarrer en mode développement
yarn dev

# Démarrer en mode production
yarn start
```

## Variables d'environnement

Copiez le fichier `env.example` vers `.env` et configurez vos variables :

```bash
cp env.example .env
```

## API Endpoints

- `/api/clients` - Gestion des clients
- `/api/transporteurs` - Gestion des transporteurs
- `/api/commissionnaires` - Gestion des commissionnaires

## Déploiement

Le projet est configuré pour le déploiement sur Render.com avec la commande de build `yarn install` et la commande de démarrage `yarn start`.
