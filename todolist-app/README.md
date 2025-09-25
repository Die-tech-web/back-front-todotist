# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# TodoList App – Documentation des routes API

## Structure des routes utilisées côté frontend

L’application utilise des appels HTTP (fetch) vers un backend Node.js/Express pour gérer l’authentification et les tâches. Voici les principales routes utilisées :

### Authentification

- **Connexion**
  - `POST /auth/login`
  - Corps : `{ login, password }`
  - Réponse : `{ token }` (stocké dans localStorage)
- **Inscription**
  - `POST /auth/register`
  - Corps : `{ nom, login, password }`
  - Réponse : message de succès ou d’erreur

### Tâches

- **Récupérer la liste des tâches**
  - `GET /todos`
  - En-tête : `Authorization: Bearer <token>`
  - Réponse : tableau des tâches
- **Créer une tâche**
  - `POST /todos`
  - Corps : `FormData` avec les champs : nom, title, description, statut, file (image optionnelle)
  - En-tête : `Authorization: Bearer <token>`
  - Réponse : tâche créée
- **Modifier une tâche**
  - `PUT /todos/:id`
  - Corps : `{ title, description, statut }`
  - En-tête : `Authorization: Bearer <token>`
  - Réponse : tâche modifiée
- **Supprimer une tâche**
  - `DELETE /todos/:id`
  - En-tête : `Authorization: Bearer <token>`
  - Réponse : message de succès

## Appel des routes dans le frontend

- Les appels se font avec `fetch` dans les composants React.
- Le token est récupéré depuis le localStorage et envoyé dans l’en-tête Authorization pour toutes les routes protégées.
- Les réponses du backend sont traitées pour afficher les messages ou mettre à jour l’UI.

## Exemple d’appel (connexion)

```js
fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ login, password }),
});
```

## Exemple d’appel (liste des tâches)

```js
fetch("http://localhost:3000/todos", {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
```

## Validation des formulaires (connexion, inscription, création de tâche)

- Les champs obligatoires sont vérifiés manuellement dans chaque composant React.
- Si un champ requis est vide, un message d’erreur s’affiche sous le champ ou en haut du formulaire (en rouge ou vert selon le contexte).
- Exemple : pour la création de tâche, si le titre ou le statut est vide, un message s’affiche en vert : `Le titre est obligatoire.`
- Si la création réussit, un message de succès s’affiche en vert : `Tâche créée avec succès !`
- Aucun attribut HTML `required` n’est utilisé, tout est géré en JavaScript pour garder le contrôle sur l’UX.
- Les messages de validation n’altèrent pas les autres fonctionnalités (fetch, affichage, etc.).

## Déconnexion

- Un bouton "Déconnexion" est affiché dans le header lorsque l’utilisateur est connecté.
- Lorsqu’on clique sur ce bouton :
  - Le token et le nom/login de l’utilisateur sont supprimés du localStorage/sessionStorage.
  - L’état React repasse à "déconnecté" (l’UI revient sur la page de connexion).
  - L’utilisateur ne peut plus accéder aux tâches ni revenir en arrière (précédent) pour voir les données protégées.
- La déconnexion n’altère pas les autres fonctionnalités : tout est géré côté frontend, sans rechargement de page.

## Pagination de la liste des tâches

- La pagination est gérée côté frontend dans le composant `ListTaches.jsx`.
- Un état React `page` permet de savoir quelle page est affichée.
- Un nombre fixe de tâches par page (`tachesParPage`, par exemple 8) est défini.
- Les tâches à afficher sont calculées avec :
  - `const startIdx = (page - 1) * tachesParPage;`
  - `const endIdx = startIdx + tachesParPage;`
  - `const tachesPage = taches.slice(startIdx, endIdx);`
- Des boutons "Précédent" et "Suivant" permettent de naviguer entre les pages.
- Le nombre total de pages est calculé avec : `const totalPages = Math.ceil(taches.length / tachesParPage);`
- Exemple de code :

```js
const [page, setPage] = useState(1);
const tachesParPage = 8;
const totalPages = Math.ceil(taches.length / tachesParPage);
const startIdx = (page - 1) * tachesParPage;
const endIdx = startIdx + tachesParPage;
const tachesPage = taches.slice(startIdx, endIdx);

// Boutons de navigation
<button onClick={() => setPage(page - 1)} disabled={page === 1}>Précédent</button>
<button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Suivant</button>
```

- La pagination n’altère pas les autres fonctionnalités : elle ne fait que limiter l’affichage à X tâches par page et gérer la navigation.

## Effet de flou derrière le formulaire de création de tâche

- L’effet de flou est obtenu grâce à la classe Tailwind CSS `blur-sm`.
- Quand le formulaire de création de tâche est ouvert (`showForm`), la classe `blur-sm` est appliquée à la div principale qui contient la liste des tâches.
- Exemple :

```jsx
<div className={showForm ? "blur-sm pointer-events-none select-none" : ""}>
  {/* ...contenu... */}
</div>
```

- La classe `blur-sm` ajoute un flou visuel sur tout le contenu derrière le formulaire modal.
- Cela permet de mettre en avant le formulaire et d’atténuer le reste de la page.

## Retour à la page de connexion après actualisation

- Quand tu actualises la page, l’état React (isConnected) est réinitialisé car il n’est pas conservé après un refresh.
- Si le token d’authentification n’est pas retrouvé dans le localStorage/sessionStorage, l’application affiche la page de connexion.
- Pour rester connecté après actualisation, il faut vérifier le token au chargement de l’application et mettre à jour l’état React en conséquence.
- Ce comportement est normal pour une SPA sécurisée : l’accès aux données protégées dépend du token stocké côté client.

---

Pour plus de détails, voir le code des composants ou du backend.
