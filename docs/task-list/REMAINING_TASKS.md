# Tâches restantes - BookMarkd

Ce document liste toutes les fonctionnalités manquantes par rapport aux spécifications initiales du projet BookMarkd.

## 📋 Table des matières

1. [Fonctionnalités sociales](#1-fonctionnalités-sociales)
2. [Fonctionnalités livres](#2-fonctionnalités-livres)
3. [Fonctionnalités feed](#3-fonctionnalités-feed)
4. [Fonctionnalités recherche](#4-fonctionnalités-recherche)
5. [Fonctionnalités profils](#5-fonctionnalités-profils)
6. [Fonctionnalités listes](#6-fonctionnalités-listes)
7. [Système de recommandations](#7-système-de-recommandations)
8. [Système d'activités](#8-système-dactivités)
9. [Authentification](#9-authentification)
10. [Base de données](#10-base-de-données)
11. [Notifications](#11-notifications)
12. [UI/UX](#12-uiux)

---

## 1. Fonctionnalités sociales

### 1.1. Système de demandes de suivi (Follow Requests)

**Statut** : ❌ Non implémenté

**Description** :

- Le modèle `Follow` existe dans la base de données mais doit être étendu
- Un utilisateur peut **demander** à suivre un autre utilisateur (pas de suivi direct)
- L'utilisateur cible reçoit une demande qu'il peut accepter ou refuser
- Nécessite un nouveau modèle `FollowRequest` dans la base de données

**Tâches** :

- [x] Créer modèle `FollowRequest` dans Prisma :
  - `id`, `requesterId`, `targetId`, `status` (pending, accepted, rejected), `createdAt`, `respondedAt`
- [ ] Créer migration Prisma (à faire quand la DB est accessible)
- [x] Créer `src/server/actions/follow.ts` avec :
  - `requestFollow(targetUserId: string)` - Demander à suivre un utilisateur
  - `cancelFollowRequest(targetUserId: string)` - Annuler une demande en attente
  - `acceptFollowRequest(requestId: string)` - Accepter une demande
  - `rejectFollowRequest(requestId: string)` - Refuser une demande
  - `getFollowRequests(userId: string)` - Récupérer les demandes reçues
  - `getPendingFollowRequests(userId: string)` - Récupérer les demandes envoyées en attente
  - `getFollowStatus(userId: string)` - Vérifier le statut (suivi, demande en attente, etc.)
  - `unfollowUser(userId: string)` - Désabonner un utilisateur (si déjà suivi)
  - `getFollowers(userId: string)` - Liste des followers
  - `getFollowing(userId: string)` - Liste des utilisateurs suivis
- [x] Créer composant `src/components/profile/follow-request-button.tsx` :
  - Afficher "Demander à suivre" si pas de demande
  - Afficher "Demande envoyée" si demande en attente
  - Afficher "Suivi" si déjà suivi
- [x] Créer composant `src/components/profile/follow-requests-panel.tsx` :
  - Afficher les demandes reçues
  - Boutons accepter/refuser pour chaque demande
- [x] Créer composant `src/components/profile/followers-list.tsx`
- [x] Créer composant `src/components/profile/following-list.tsx`
- [x] Ajouter section "Demandes de suivi" sur le profil utilisateur
- [ ] Créer activité lors d'une demande acceptée (voir section 8)
- [ ] Créer notification lors d'une nouvelle demande (voir section 11)

**Fichiers à créer/modifier** :

- `prisma/schema.prisma` (ajouter modèle `FollowRequest`)
- Migration Prisma (créer)
- `src/server/actions/follow.ts` (nouveau)
- `src/components/profile/follow-request-button.tsx` (nouveau)
- `src/components/profile/follow-requests-panel.tsx` (nouveau)
- `src/components/profile/followers-list.tsx` (nouveau)
- `src/components/profile/following-list.tsx` (nouveau)
- `src/app/profiles/[username]/page.tsx` (modifier - à créer d'abord)
- `src/app/profiles/me/page.tsx` (ajouter section demandes)

---

### 1.2. Follow/Unfollow (après acceptation)

**Statut** : ❌ Non implémenté

**Description** :

- Une fois une demande acceptée, la relation `Follow` est créée
- Un utilisateur peut se désabonner d'un autre utilisateur qu'il suit
- Affichage des followers/following sur les profils

**Tâches** :

- [ ] Implémenter `unfollowUser` dans `src/server/actions/follow.ts`
- [ ] Gérer l'affichage du statut de suivi (suivi, pas suivi, demande en attente)
- [ ] Créer activité lors d'un unfollow (optionnel)

**Fichiers à modifier** :

- `src/server/actions/follow.ts` (modifier)
- `src/components/profile/follow-request-button.tsx` (modifier)

---

### 1.3. Likes sur les commentaires (reviews)

**Statut** : ❌ Non implémenté

**Description** :

- Le modèle `ReviewLike` existe dans la base de données
- Aucune action serveur pour liker/unliker
- Aucune UI pour afficher/ajouter des likes
- Les likes ne sont pas récupérés dans les requêtes de reviews

**Tâches** :

- [x] Créer `src/server/actions/review.ts` avec :
  - `likeReview(reviewId: string)` - Liker un commentaire
  - `unlikeReview(reviewId: string)` - Retirer le like
  - `getReviewLikes(reviewId: string)` - Récupérer les likes d'un commentaire
- [x] Modifier `src/app/books/[slug]/page.tsx` pour inclure les likes dans les reviews
- [x] Modifier `src/components/books/reviews-list.tsx` pour :
  - Afficher le nombre de likes
  - Afficher un bouton like/unlike
  - Afficher la liste des utilisateurs ayant liké (optionnel)
- [x] Créer composant `src/components/books/review-like-button.tsx`

**Fichiers à créer/modifier** :

- `src/server/actions/review.ts` (nouveau - ou étendre `book.ts`)
- `src/components/books/review-like-button.tsx` (nouveau)
- `src/components/books/reviews-list.tsx` (modifier)
- `src/app/books/[slug]/page.tsx` (modifier)

---

## 2. Fonctionnalités livres

### 2.1. Liste des lecteurs sur la page livre

**Statut** : ✅ Implémenté

**Description** :

- Les spécifications demandent d'afficher "Liste des utilisateurs l'ayant lu"
- Actuellement, seule la note moyenne et le nombre de votes sont affichés
- Pas de section listant les utilisateurs ayant lu/noté le livre

**Tâches** :

- [x] Créer fonction serveur pour récupérer les lecteurs d'un livre :
  - `src/features/books/server/get-book-readers.ts`
  - Retourner : utilisateurs ayant lu (avec statut), noté, commenté
- [x] Créer composant `src/components/books/book-readers-list.tsx`
- [x] Ajouter section sur `src/app/books/[slug]/page.tsx`
- [x] Afficher avatars, noms, statuts de lecture, notes

**Fichiers à créer/modifier** :

- `src/features/books/server/get-book-readers.ts` (nouveau)
- `src/components/books/book-readers-list.tsx` (nouveau)
- `src/app/books/[slug]/page.tsx` (modifier)

---

### 2.2. Filtrage des reviews par visibilité (friends)

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Les reviews ont un champ `visibility` (public, friends, private)
- Le filtrage actuel ne vérifie que si le viewer est l'auteur
- Il faut vérifier si le viewer suit l'auteur pour les reviews "friends"

**Tâches** :

- [ ] Modifier `src/app/books/[slug]/page.tsx` dans `mapReviews` :
  - Vérifier si `visibility === "friends"` et si le viewer suit l'auteur
  - Utiliser la relation `Follow` pour vérifier
- [ ] Tester avec différents scénarios (public, friends, private)

**Fichiers à modifier** :

- `src/app/books/[slug]/page.tsx` (modifier)

---

## 3. Fonctionnalités feed

### 3.1. Boutons d'action sur les cartes du feed

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Les spécifications demandent : "Boutons : Ajouter à la readlist, noter, commenter"
- Vérifier que tous les boutons sont présents sur les cartes du feed

**Tâches** :

- [ ] Vérifier `src/components/feed/book-feed-card.tsx`
- [ ] Ajouter bouton "Ajouter à la readlist" si manquant
- [ ] Ajouter bouton "Noter" si manquant
- [ ] Ajouter bouton "Commenter" (lien vers page livre) si manquant

**Fichiers à modifier** :

- `src/components/feed/book-feed-card.tsx` (vérifier/modifier)
- `src/components/feed/recommendation-card.tsx` (vérifier/modifier)

---

## 4. Fonctionnalités recherche

### 4.1. Recherche d'utilisateurs

**Statut** : ❌ Non implémenté

**Description** :

- Actuellement, la recherche ne permet que de chercher des livres
- Il faut ajouter la possibilité de chercher des utilisateurs
- La recherche doit permettre de basculer entre recherche de livres et recherche d'utilisateurs
- Les résultats doivent permettre d'accéder au profil de l'utilisateur et de demander à le suivre

**Tâches** :

- [x] Modifier `src/components/search/search-client.tsx` pour :
  - Ajouter un onglet/switch "Livres" / "Utilisateurs"
  - Afficher les résultats d'utilisateurs dans une grille de cartes
- [x] Créer composant `src/components/search/user-result-card.tsx` :
  - Afficher avatar, nom, bio (tronquée)
  - Bouton "Voir le profil"
  - Bouton "Demander à suivre" (ou statut si déjà suivi/demande envoyée)
- [x] Créer API route `src/app/api/users/search/route.ts` :
  - Recherche par username, displayName, email (optionnel)
  - Retourner : id, username, displayName, avatarUrl, bio, stats (livres lus, followers)
  - Filtrer les utilisateurs privés si nécessaire
- [x] Créer hook `src/features/search/api/use-user-search.ts` :
  - Utiliser TanStack Query
  - Gérer les états de chargement/erreur
- [x] Modifier la page de recherche pour gérer les deux types de résultats
- [ ] Ajouter filtres pour la recherche d'utilisateurs (optionnel) :
  - Par nombre de followers
  - Par nombre de livres lus

**Fichiers à créer/modifier** :

- `src/app/api/users/search/route.ts` (nouveau)
- `src/features/search/api/use-user-search.ts` (nouveau)
- `src/features/search/types.ts` (ajouter types pour utilisateurs)
- `src/components/search/search-client.tsx` (modifier - ajouter onglets)
- `src/components/search/user-result-card.tsx` (nouveau)
- `src/components/search/search-result-card.tsx` (renommer en `book-result-card.tsx` si nécessaire)

---

### 4.2. Filtres avancés pour les livres

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Filtres actuels : genre (tags), inclusion Open Library
- Filtres manquants selon spécifications :
  - Filtre par note moyenne (ex: 4+ étoiles)
  - Filtre par état de lecture (à lire, en cours, lu)
  - Filtre par auteur (recherche spécifique)

**Tâches** :

- [ ] Ajouter filtre par note dans `src/components/search/search-client.tsx`
- [ ] Ajouter filtre par état de lecture
- [ ] Modifier `src/app/api/books/search/route.ts` pour supporter ces filtres
- [ ] Ajouter UI pour ces filtres (slider pour note, select pour état)

**Fichiers à modifier** :

- `src/components/search/search-client.tsx` (modifier)
- `src/app/api/books/search/route.ts` (modifier)
- `src/features/search/types.ts` (modifier si nécessaire)

---

## 2. Fonctionnalités livres

### 2.1. Liste des lecteurs sur la page livre

**Statut** : ✅ Implémenté

**Description** :

- Les spécifications demandent d'afficher "Liste des utilisateurs l'ayant lu"
- Actuellement, seule la note moyenne et le nombre de votes sont affichés
- Pas de section listant les utilisateurs ayant lu/noté le livre

**Tâches** :

- [x] Créer fonction serveur pour récupérer les lecteurs d'un livre :
  - `src/features/books/server/get-book-readers.ts`
  - Retourner : utilisateurs ayant lu (avec statut), noté, commenté
- [x] Créer composant `src/components/books/book-readers-list.tsx`
- [x] Ajouter section sur `src/app/books/[slug]/page.tsx`
- [x] Afficher avatars, noms, statuts de lecture, notes

**Fichiers à créer/modifier** :

- `src/features/books/server/get-book-readers.ts` (nouveau)
- `src/components/books/book-readers-list.tsx` (nouveau)
- `src/app/books/[slug]/page.tsx` (modifier)

---

### 2.2. Filtrage des reviews par visibilité (friends)

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Les reviews ont un champ `visibility` (public, friends, private)
- Le filtrage actuel ne vérifie que si le viewer est l'auteur
- Il faut vérifier si le viewer suit l'auteur pour les reviews "friends"

**Tâches** :

- [ ] Modifier `src/app/books/[slug]/page.tsx` dans `mapReviews` :
  - Vérifier si `visibility === "friends"` et si le viewer suit l'auteur
  - Utiliser la relation `Follow` pour vérifier
- [ ] Tester avec différents scénarios (public, friends, private)

**Fichiers à modifier** :

- `src/app/books/[slug]/page.tsx` (modifier)

---

## 3. Fonctionnalités feed

### 3.1. Boutons d'action sur les cartes du feed

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Les spécifications demandent : "Boutons : Ajouter à la readlist, noter, commenter"
- Vérifier que tous les boutons sont présents sur les cartes du feed

**Tâches** :

- [ ] Vérifier `src/components/feed/book-feed-card.tsx`
- [ ] Ajouter bouton "Ajouter à la readlist" si manquant
- [ ] Ajouter bouton "Noter" si manquant
- [ ] Ajouter bouton "Commenter" (lien vers page livre) si manquant

**Fichiers à modifier** :

- `src/components/feed/book-feed-card.tsx` (vérifier/modifier)
- `src/components/feed/recommendation-card.tsx` (vérifier/modifier)

---

## 5. Fonctionnalités profils

### 5.1. Profils publics par username

**Statut** : ✅ Implémenté

**Description** :

- Actuellement, seul `/profiles/me` existe
- Pas de route `/profiles/[username]` pour voir les profils publics
- Le schéma Prisma n'a pas de champ `username` (seulement `displayName`)

**Tâches** :

- [x] Ajouter champ `username` au modèle `User` dans Prisma :
  - Unique, optionnel au début (migration)
  - Générer automatiquement à partir de l'email si non fourni
- [ ] Créer migration Prisma (à faire quand la DB est accessible)
- [x] Créer `src/app/profiles/[username]/page.tsx`
- [x] Créer fonction serveur `src/features/profile/server/get-public-profile.ts`
- [x] Afficher : bio, stats, lectures récentes, listes publiques
- [x] Ajouter bouton demande de suivi (voir section 1.1)
- [ ] Gérer les profils privés (si visibilité ajoutée)

**Fichiers à créer/modifier** :

- `prisma/schema.prisma` (modifier - ajouter `username`)
- Migration Prisma (créer)
- `src/app/profiles/[username]/page.tsx` (nouveau)
- `src/features/profile/server/get-public-profile.ts` (nouveau)
- `src/components/profile/public-profile-header.tsx` (nouveau)

---

### 5.2. Journal/activité complète sur profil

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- `RecentActivitiesSection` existe mais peut être amélioré
- Les spécifications demandent un "journal/activité complète"
- Peut-être ajouter une page dédiée `/profiles/[username]/activity`

**Tâches** :

- [ ] Vérifier que toutes les activités sont affichées
- [ ] Ajouter pagination si nécessaire
- [ ] Créer page dédiée `/profiles/[username]/activity` (optionnel)
- [ ] Filtrer par type d'activité (optionnel)

**Fichiers à modifier/créer** :

- `src/components/profile/recent-activities-section.tsx` (vérifier/améliorer)
- `src/app/profiles/[username]/activity/page.tsx` (optionnel)

---

## 6. Fonctionnalités listes

### 6.1. Partage de listes

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Les listes ont un champ `visibility` (public, unlisted, private)
- Pas d'UI pour partager une liste (lien, copier lien)
- Pas de page publique pour les listes "unlisted"

**Tâches** :

- [ ] Ajouter bouton "Partager" sur `src/app/lists/[listId]/page.tsx`
- [ ] Créer composant `src/components/lists/share-list-button.tsx`
- [ ] Implémenter copie de lien dans le presse-papier
- [ ] Gérer les listes "unlisted" (accessibles via lien direct)

**Fichiers à créer/modifier** :

- `src/components/lists/share-list-button.tsx` (nouveau)
- `src/app/lists/[listId]/page.tsx` (modifier)

---

### 6.2. Drag & drop pour réorganiser les listes

**Statut** : ❌ Non implémenté

**Description** :

- Les spécifications mentionnent "ListEditor" avec drag & drop
- Actuellement, les listes utilisent un champ `position` mais pas d'UI drag & drop

**Tâches** :

- [ ] Installer bibliothèque drag & drop (ex: `@dnd-kit/core`)
- [ ] Créer composant `src/components/lists/list-editor.tsx` avec drag & drop
- [ ] Créer action serveur pour mettre à jour les positions
- [ ] Ajouter sur page d'édition de liste

**Fichiers à créer/modifier** :

- `src/components/lists/list-editor.tsx` (nouveau)
- `src/server/actions/lists.ts` (ajouter fonction updatePositions)
- `src/app/lists/[listId]/edit/page.tsx` (créer si n'existe pas)

---

## 7. Système de recommandations

### 7.1. Génération automatique de recommandations

**Statut** : ❌ Non implémenté

**Description** :

- Le modèle `Recommendation` existe dans la DB
- Les recommandations sont lues depuis la DB mais jamais générées
- Pas de système pour calculer les recommandations basées sur :
  - Ce que l'utilisateur a lu
  - Ce que ses amis ont lu
  - Suggestions similaires ("si t'as aimé X, tu aimeras Y")

**Tâches** :

- [ ] Créer service `src/lib/recommendations/generator.ts` avec :
  - `generateFriendsRecommendations(userId)` - Basé sur les lectures d'amis
  - `generateSimilarRecommendations(userId)` - Basé sur les livres similaires (tags, auteurs)
  - `generateGlobalRecommendations(userId)` - Tendances globales
- [ ] Créer job/cron pour générer les recommandations (ou API route)
- [ ] Créer action serveur `src/server/actions/recommendations.ts`
- [ ] Planifier génération périodique (cron job ou API route appelée périodiquement)

**Fichiers à créer** :

- `src/lib/recommendations/generator.ts` (nouveau)
- `src/server/actions/recommendations.ts` (nouveau)
- `src/app/api/recommendations/generate/route.ts` (nouveau - optionnel)

---

### 7.2. Algorithme de similarité

**Statut** : ❌ Non implémenté

**Description** :

- Pour les recommandations "similaires", il faut un algorithme
- Basé sur : tags communs, auteurs similaires, notes similaires

**Tâches** :

- [ ] Créer fonction de calcul de similarité entre livres
- [ ] Utiliser tags, auteurs, notes moyennes
- [ ] Intégrer dans `generateSimilarRecommendations`

**Fichiers à modifier** :

- `src/lib/recommendations/generator.ts` (ajouter algorithme)

---

## 8. Système d'activités

### 8.1. Création automatique d'activités

**Statut** : ❌ Non implémenté

**Description** :

- Le modèle `Activity` existe dans la DB
- Les activités sont lues pour le feed mais jamais créées
- Il faut créer des activités lors de :
  - Notation d'un livre (`rateBook`)
  - Création d'un commentaire (`createReview`)
  - Changement de statut (`updateReadingStatus`)
  - Mise à jour de liste (`updateList`)
  - Follow/unfollow (`followUser`)

**Tâches** :

- [ ] Créer fonction utilitaire `src/lib/activities/create-activity.ts`
- [ ] Modifier `src/server/actions/book.ts` :
  - Appeler `createActivity` dans `rateBook`
  - Appeler `createActivity` dans `createReview`
  - Appeler `createActivity` dans `updateReadingStatus`
- [ ] Modifier `src/server/actions/lists.ts` :
  - Appeler `createActivity` lors de création/modification de liste
- [ ] Modifier `src/server/actions/follow.ts` (à créer) :
  - Appeler `createActivity` lors d'une demande acceptée

**Fichiers à créer/modifier** :

- `src/lib/activities/create-activity.ts` (nouveau)
- `src/server/actions/book.ts` (modifier)
- `src/server/actions/lists.ts` (modifier)
- `src/server/actions/follow.ts` (créer et modifier)

---

### 8.2. Format des payloads d'activités

**Statut** : ⚠️ À documenter

**Description** :

- Les activités utilisent un champ `payload` (JSON)
- Il faut définir la structure des payloads pour chaque type

**Tâches** :

- [ ] Documenter la structure des payloads :
  - `rating`: `{ bookId, bookTitle, rating }`
  - `review`: `{ bookId, bookTitle, reviewId, reviewSnippet }`
  - `status_change`: `{ bookId, bookTitle, oldStatus, newStatus }`
  - `list_update`: `{ listId, listTitle, action }`
  - `follow_request_accepted`: `{ targetUserId, targetUserName }`
- [ ] Créer types TypeScript pour les payloads
- [ ] Utiliser ces types dans `create-activity.ts`

**Fichiers à créer/modifier** :

- `src/lib/activities/types.ts` (nouveau)
- `src/lib/activities/create-activity.ts` (utiliser les types)

---

## 9. Authentification

### 9.1. Username unique

**Statut** : ❌ Non implémenté

**Description** :

- Le schéma Prisma n'a pas de champ `username`
- Les spécifications mentionnent un `username` unique
- Nécessaire pour les URLs de profils publics

**Tâches** :

- [ ] Ajouter champ `username` au modèle `User` (voir section 5.1)
- [ ] Créer migration
- [ ] Générer username automatiquement lors de l'inscription
- [ ] Permettre modification du username dans le profil

**Fichiers à modifier** :

- `prisma/schema.prisma` (modifier)
- `src/server/actions/auth.ts` (modifier - générer username)
- `src/components/profile/profile-edit-form.tsx` (ajouter champ username)

---

## 10. Base de données

### 10.1. Champs manquants dans le schéma

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Comparaison avec `docs/DB_SCHEMA.md` :
  - `users.username` : manquant (voir section 9.2)
  - `users.location` : manquant
  - `users.preferences` (jsonb) : manquant

**Tâches** :

- [ ] Ajouter `username` (unique) au modèle `User`
- [ ] Ajouter `location` (optionnel) au modèle `User`
- [ ] Ajouter `preferences` (Json) au modèle `User`
- [ ] Créer migration Prisma
- [ ] Mettre à jour les types TypeScript

**Fichiers à modifier** :

- `prisma/schema.prisma` (modifier)
- Migration Prisma (créer)

---

### 10.2. Index manquants

**Statut** : ⚠️ À vérifier

**Description** :

- `docs/DB_SCHEMA.md` mentionne plusieurs index
- Vérifier que tous les index sont présents dans Prisma

**Tâches** :

- [ ] Vérifier index full-text sur `books.title`, `books.author`, `books.summary`
- [ ] Vérifier index sur `book_tags.tag_id`
- [ ] Vérifier index composite sur `user_books(user_id, status)`
- [ ] Vérifier index sur `reviews(visibility, created_at)`
- [ ] Vérifier index sur `activities(created_at)`
- [ ] Ajouter les index manquants dans Prisma ou via migration SQL

**Fichiers à modifier** :

- `prisma/schema.prisma` (ajouter `@@index` si nécessaire)
- Ou créer migration SQL directe

---

## 11. Notifications

### 11.1. Système de notifications

**Statut** : ❌ Non implémenté

**Description** :

- Le modèle `Notification` est mentionné dans `docs/DB_SCHEMA.md` comme "futur"
- Pas de table dans Prisma
- Pas d'UI pour afficher les notifications

**Tâches** :

- [ ] Créer modèle `Notification` dans Prisma :
  - `id`, `userId`, `type`, `payload` (Json), `readAt`, `createdAt`
- [ ] Créer migration
- [ ] Créer actions serveur pour :
  - Créer notification
  - Marquer comme lue
  - Récupérer notifications non lues
- [ ] Créer composant `src/components/notifications/notification-bell.tsx`
- [ ] Créer page `/notifications`
- [ ] Créer notifications pour :
  - Nouvelle demande de suivi (follow request)
  - Demande de suivi acceptée
  - Like sur review
  - Commentaire sur review
  - Nouvelle recommandation

**Fichiers à créer** :

- `prisma/schema.prisma` (ajouter modèle)
- `src/server/actions/notifications.ts` (nouveau)
- `src/components/notifications/notification-bell.tsx` (nouveau)
- `src/app/notifications/page.tsx` (nouveau)
- `src/components/notifications/notifications-list.tsx` (nouveau)

---

## 12. UI/UX

### 12.1. Design responsive

**Statut** : ⚠️ À vérifier

**Description** :

- Les spécifications demandent un design responsive
- Vérifier que toutes les pages sont bien responsive

**Tâches** :

- [ ] Tester toutes les pages sur mobile/tablette
- [ ] Vérifier le layout 3 colonnes du feed (doit stack sur mobile)
- [ ] Vérifier les formulaires
- [ ] Vérifier les modales/dialogs

**Fichiers à vérifier** :

- Tous les composants et pages

---

### 12.2. Accessibilité

**Statut** : ⚠️ À améliorer

**Description** :

- Les spécifications mentionnent l'accessibilité
- Vérifier aria-labels, navigation clavier, etc.

**Tâches** :

- [ ] Auditer l'accessibilité de tous les composants
- [ ] Ajouter aria-labels manquants
- [ ] Vérifier navigation clavier
- [ ] Tester avec lecteur d'écran

**Fichiers à vérifier** :

- Tous les composants

---

### 12.3. États de chargement et erreurs

**Statut** : ⚠️ Partiellement implémenté

**Description** :

- Vérifier que tous les états de chargement et erreurs sont gérés

**Tâches** :

- [ ] Vérifier que tous les composants ont des états de chargement
- [ ] Vérifier que toutes les erreurs sont affichées
- [ ] Ajouter composants `EmptyState`, `ErrorState` si manquants

**Fichiers à vérifier** :

- Tous les composants client

---

## 📊 Résumé par priorité

### Priorité Haute (Fonctionnalités core)

1. ✅ Système de demandes de suivi (Follow Requests)
2. ✅ Recherche d'utilisateurs
3. ✅ Likes sur les commentaires
4. ✅ Liste des lecteurs sur page livre
5. ✅ Profils publics par username
6. ✅ Génération automatique de recommandations
7. ✅ Création automatique d'activités

### Priorité Moyenne (Améliorations UX)

8. ⚠️ Layout 3 colonnes du feed
9. ⚠️ Filtres avancés de recherche (livres)
10. ⚠️ Partage de listes
11. ⚠️ Drag & drop pour listes
12. ⚠️ Système de notifications

### Priorité Basse (Nice to have)

13. ⚠️ Champs manquants DB (location, preferences)
14. ⚠️ Améliorations accessibilité
15. ⏸️ OAuth (mis de côté pour le moment)

---

## 📝 Notes

- Les tâches marquées ✅ sont critiques pour le fonctionnement de base
- Les tâches marquées ⚠️ sont des améliorations importantes
- Tester chaque fonctionnalité après implémentation
- Mettre à jour la documentation (`docs/`) après chaque ajout majeur

---

**Dernière mise à jour** : [Date de création du document]
**Version** : 1.0
