# TodoList – Projet Fullstack (Express/Prisma + React/Vite)

Ce projet regroupe deux applications :

- **todolist** : Backend Node.js/Express + Prisma/PostgreSQL
- **todolist-app** : Frontend React + Vite

## Fonctionnalités principales

- Authentification JWT (inscription, connexion, déconnexion)
- Gestion des tâches (CRUD)
- Ajout de fichiers audio et images aux tâches
- Gestion des privilèges (édition/suppression par utilisateur)
- Historique des actions sur les tâches
- Badge de notification (nombre de tâches terminées)
- Affichage des dates de début/fin pour chaque tâche
- Pagination de la liste des tâches

---

## Structure du projet

```
/ (racine)
├── todolist/         # Backend Express/Prisma
│   ├── src/
│   ├── prisma/
│   ├── public/images/
│   ├── package.json
│   └── ...
├── todolist-app/     # Frontend React/Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── README.md         # Ce fichier
```

---

## Installation

### 1. Backend (todolist)

```bash
cd todolist
npm install
```

- Configure la base PostgreSQL dans `prisma/schema.prisma` et `.env` si besoin.
- Migration de la base :

```bash
npx prisma migrate dev
```

- (Optionnel) Seed de données de test :

```bash
npx ts-node seed.ts
```

### 2. Frontend (todolist-app)

```bash
cd todolist-app
npm install
```

---

## Lancement des serveurs

### Backend (Express)

```bash
cd todolist
npm run dev
```

- Le serveur démarre sur : `http://localhost:3000`

### Frontend (React/Vite)

```bash
cd todolist-app
npm run dev
```

- L’application démarre sur : `http://localhost:5173` (par défaut)

---

## Utilisation – Accès rapide

### 1. Inscription

- Route : `POST /auth/register`
- Exemple :

```json
{
  "nom": "madie",
  "login": "madie",
  "password": "ebeno"
}
```

### 2. Connexion

- Route : `POST /auth/login`
- Exemple :

```json
{
  "login": "madie",
  "password": "ebeno"
}
```

- Réponse : `{ token, user }`

### 3. Logins et mots de passe de test

| Utilisateur | Login   | Mot de passe |
| ----------- | ------- | ------------ |
| Madie       | madie   | motdepasse   |
| Ousmane     | ousmane | motdepasse   |
| Test        | test    | test123      |

> Tu peux créer d’autres utilisateurs via l’inscription.

### 4. Créer une tâche

- Route : `POST /todos`
- Authentification requise (token JWT dans l’en-tête Authorization)
- Exemple de body JSON :

```json
{
  "nom": "madie",
  "title": "Ma tâche",
  "description": "Description...",
  "statut": "en cours",
  "dateDebut": "2025-09-25T10:00",
  "dateFin": "2025-09-26T18:00"
}
```

- Pour l’envoi de fichiers (image/audio), le frontend utilise FormData (voir code React)

### 5. Liste des tâches

- Route : `GET /todos`
- Affiche toutes les tâches avec dates, fichiers, statut, utilisateur, etc.

### 6. Badge de notification

- Route : `GET /todos/notifications/count`
- Retourne le nombre de tâches terminées (affiché dans le header du frontend)

---

## Fonctionnement technique

- **Backend** : Express + Prisma/PostgreSQL
  - Authentification JWT
  - Validation des champs et des dates
  - Gestion des fichiers via `multer` (upload multipart/form-data)
  - Historique des actions (lecture, création, modification, suppression)
  - Privilèges par tâche (édition/suppression)
- **Frontend** : React + Vite
  - Formulaire de création de tâche (avec dates, fichiers)
  - Liste des tâches paginée
  - Badge de notification
  - Affichage des dates de début/fin
  - Toasts de succès/erreur

---

## Conseils pour le développement

- Toujours lancer le backend avant le frontend.
- Vérifier la connexion à la base PostgreSQL.
- Les tokens JWT sont stockés dans localStorage/sessionStorage côté frontend.
- Les fichiers audio/images sont stockés dans `todolist/public/images` côté backend.
- Pour tester l’API, tu peux utiliser Postman ou curl (voir exemples dans les README des dossiers).

---

## Pour aller plus loin

- Ajoute des utilisateurs, des tâches, des fichiers audio/images pour tester toutes les fonctionnalités.
- Modifie les privilèges pour tester l’édition/suppression par différents utilisateurs.
- Consulte l’historique des actions pour voir les logs.

---

## Auteur

Projet réalisé par Madie

---

