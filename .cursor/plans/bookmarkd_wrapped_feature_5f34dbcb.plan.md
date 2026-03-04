---
name: Bookmarkd Wrapped Feature
overview: Créer un système de "Bookmarkd Wrapped" disponible toute l'année pour les admins via un bandeau dans la page notifications, retraçant les statistiques de lecture de l'année avec des visuels attrayants et des statistiques personnalisées.
todos:
  - id: wrapped-route
    content: Créer la route /wrapped/[year] accessible toute l'année
    status: in_progress
  - id: wrapped-stats-service
    content: Implémenter getWrappedStats avec requêtes SQL pour calculer toutes les statistiques
    status: completed
  - id: wrapped-types
    content: Créer les types TypeScript pour WrappedStats et les composants
    status: completed
  - id: wrapped-container
    content: Créer WrappedContainer avec navigation entre slides (swipe/flèches)
    status: completed
  - id: wrapped-slides
    content: Créer les composants de slides individuelles (TotalBooks, FavoriteCategory, TopBooks, etc.)
    status: completed
  - id: wrapped-utils
    content: Implémenter les utilitaires de gestion des dates et années
    status: completed
  - id: wrapped-share
    content: Ajouter fonctionnalité de partage social avec génération image/carte
    status: pending
  - id: wrapped-admin-banner
    content: Ajouter bandeau dans la page notifications pour les admins avec lien vers wrapped
    status: pending
isProject: false
---

# Bookmarkd Wrapped - Plan d'implémentation

## Vue d'ensemble

Le Bookmarkd Wrapped sera une expérience permettant aux utilisateurs de découvrir leurs statistiques de lecture de l'année écoulée avec un design moderne et engageant, similaire aux wrapped de Spotify, Instagram, etc.

**Accès** :

- **Disponible toute l'année** pour tous les utilisateurs
- **Bandeau promotionnel** dans la page notifications **uniquement pour les utilisateurs admin**
- Le bandeau permet d'accéder directement au wrapped de l'année en cours

## Propositions de statistiques et sections

### Proposition 1 : Statistiques essentielles (MVP)

- **Nombre total de livres lus** en 2026
- **Catégorie/genre préféré** (basé sur les tags les plus fréquents)
- **Note moyenne** de l'année
- **Meilleur livre** (plus haute note)
- **Auteur préféré** (le plus lu)
- **Mois le plus productif** (le plus de livres terminés)

### Proposition 2 : Statistiques avancées

- **Top 5 des livres** de l'année (par note)
- **Top 3 des catégories** avec pourcentage
- **Livre le plus détesté** (plus basse note)
- **Sentiments dominants** (basé sur `user_book_feelings` - ex: "Émouvant", "Captivant")
- **Période de lecture** (matin, après-midi, soir - basé sur `updated_at` si disponible)
- **Nombre de reviews écrites**
- **Nombre de listes créées**

### Proposition 3 : Statistiques sociales

- **Ami avec le plus de livres en commun**
- **Livre le plus populaire** parmi vos amis
- **Review la plus likée**
- **Nombre de followers gagnés**

### Proposition 4 : Statistiques temporelles

- **Timeline mensuelle** des lectures
- **Jour de la semaine préféré** pour terminer des livres
- **Série de lectures** (combien de jours consécutifs avec activité)
- **Record personnel** (plus de livres lus en un mois)

### Proposition 5 : Statistiques créatives

- **Nuage de mots** des sentiments ressentis
- **Carte de chaleur** des lectures par mois
- **Graphique en barres** des catégories
- **Comparaison avec l'année précédente** (si disponible)

## Architecture technique

### 1. Route et page

**Fichier**: `src/app/wrapped/[year]/page.tsx`

- Route dynamique pour supporter différentes années
- **Disponible toute l'année** (pas de restriction temporelle)
- Accessible à tous les utilisateurs connectés
- Vérification d'authentification obligatoire

### 2. Service de calcul des statistiques

**Fichier**: `src/features/wrapped/server/get-wrapped-stats.ts`

- Fonction principale: `getWrappedStats(userId: string, year: number)`
- Requêtes SQL optimisées pour calculer toutes les statistiques
- Cache des résultats (optionnel, via Redis ou Supabase cache)

**Données à récupérer**:

```typescript
type WrappedStats = {
  year: number;
  totalBooksRead: number;
  averageRating: number;
  favoriteCategory: { name: string; count: number; percentage: number };
  topBooks: Array<{
    id: string;
    title: string;
    author: string;
    rating: number;
    coverUrl: string | null;
  }>;
  worstBook: {
    id: string;
    title: string;
    author: string;
    rating: number;
    coverUrl: string | null;
  } | null;
  favoriteAuthor: { name: string; count: number };
  mostProductiveMonth: { month: number; count: number };
  topCategories: Array<{ name: string; count: number; percentage: number }>;
  dominantFeelings: Array<{ keyword: string; count: number }>;
  reviewsWritten: number;
  listsCreated: number;
  monthlyBreakdown: Array<{ month: number; count: number }>;
  // ... autres stats
};
```

### 3. Composants UI

**Structure**:

- `src/components/wrapped/WrappedContainer.tsx` - Container principal avec navigation entre slides
- `src/components/wrapped/WrappedSlide.tsx` - Slide individuelle avec animation
- `src/components/wrapped/stats/TotalBooksSlide.tsx` - Slide "X livres lus"
- `src/components/wrapped/stats/FavoriteCategorySlide.tsx` - Slide catégorie préférée
- `src/components/wrapped/stats/TopBooksSlide.tsx` - Slide top livres avec covers
- `src/components/wrapped/stats/FeelingsSlide.tsx` - Slide sentiments avec nuage de mots
- `src/components/wrapped/stats/TimelineSlide.tsx` - Timeline mensuelle
- `src/components/wrapped/WrappedShareButton.tsx` - Bouton de partage (image/carte)

### 4. Logique de disponibilité et utilitaires

**Fichier**: `src/lib/wrapped/utils.ts`

- `getCurrentWrappedYear(): number` - Retourne l'année courante pour le wrapped
- `getAvailableYears(userId: string): Promise<number[]>` - Retourne les années disponibles pour un utilisateur (basé sur ses données)
- `isValidYear(year: number): boolean` - Vérifie si l'année est valide (pas dans le futur)

### 5. Bandeau admin dans notifications

**Fichier**: `src/components/wrapped/WrappedAdminBanner.tsx`

- Composant bandeau affiché uniquement pour les utilisateurs admin
- Visible dans la page `/notifications`
- Design attractif avec call-to-action vers le wrapped
- Vérifie le statut admin via `getCurrentUserAdminStatus()` de `@/lib/auth/admin`
- Lien vers `/wrapped/[currentYear]`

**Logique d'affichage**:

- Vérifier si l'utilisateur est admin (via `getCurrentUserAdminStatus`)
- Afficher le bandeau uniquement si admin === true
- Le bandeau peut être dismissible (optionnel, via localStorage)

### 6. Partage social

**Fichier**: `src/components/wrapped/WrappedShare.tsx`

- Génération d'image/carte partageable (via canvas ou API)
- Partage sur Twitter/X, Facebook, copie de lien
- URL format: `/wrapped/2026?share=true`

## Requêtes SQL nécessaires

### Statistiques de base

```sql
-- Livres lus dans l'année
SELECT COUNT(*) FROM user_books
WHERE user_id = $1
AND status = 'finished'
AND EXTRACT(YEAR FROM updated_at) = $2;

-- Note moyenne
SELECT AVG(rating) FROM user_books
WHERE user_id = $1
AND status = 'finished'
AND rating IS NOT NULL
AND EXTRACT(YEAR FROM rated_at) = $2;

-- Catégorie préférée
SELECT t.name, COUNT(*) as count
FROM user_books ub
JOIN book_tags bt ON ub.book_id = bt.book_id
JOIN tags t ON bt.tag_id = t.id
WHERE ub.user_id = $1
AND ub.status = 'finished'
AND EXTRACT(YEAR FROM ub.updated_at) = $2
GROUP BY t.name
ORDER BY count DESC
LIMIT 1;

-- Top livres (par note)
SELECT b.id, b.title, b.author, b.cover_url, ub.rating
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE ub.user_id = $1
AND ub.status = 'finished'
AND ub.rating IS NOT NULL
AND EXTRACT(YEAR FROM ub.rated_at) = $2
ORDER BY ub.rating DESC, ub.rated_at DESC
LIMIT 5;

-- Sentiments dominants
SELECT fk.label, COUNT(*) as count
FROM user_book_feelings ubf
JOIN feeling_keywords fk ON ubf.keyword_id = fk.id
WHERE ubf.user_id = $1
AND EXTRACT(YEAR FROM ubf.created_at) = $2
GROUP BY fk.label
ORDER BY count DESC
LIMIT 5;
```

## Design et UX

### Style visuel

- **Palette de couleurs**: Gradients vibrants (inspiré Spotify Wrapped)
- **Animations**: Transitions fluides entre slides (framer-motion ou CSS animations)
- **Typographie**: Grands chiffres, textes impactants
- **Images**: Covers de livres en mosaïque pour les top livres

### Navigation

- **Swipe horizontal** sur mobile (touch gestures)
- **Flèches gauche/droite** sur desktop
- **Barre de progression** en bas
- **Bouton "Partager"** à la fin

### Responsive

- Mobile-first design
- Adaptations pour tablette et desktop
- Optimisation des images (Next.js Image)

## Implémentation par phases

### Phase 1 : MVP (Statistiques essentielles)

1. Créer la route `/wrapped/[year]` (accessible toute l'année)
2. Implémenter `getWrappedStats` avec stats de base
3. Créer 5-6 slides principales
4. Créer le bandeau admin dans la page notifications
5. Design basique avec TailwindCSS

### Phase 2 : Statistiques avancées

1. Ajouter stats sociales et temporelles
2. Implémenter graphiques (recharts ou chart.js)
3. Améliorer les animations
4. Ajouter le partage social

### Phase 3 : Polish et optimisations

1. Cache des statistiques
2. Génération d'images pour partage
3. Comparaison année précédente
4. Analytics et tracking

## Fichiers à créer/modifier

### Nouveaux fichiers

- `src/app/wrapped/[year]/page.tsx`
- `src/features/wrapped/server/get-wrapped-stats.ts`
- `src/features/wrapped/types.ts`
- `src/components/wrapped/WrappedContainer.tsx`
- `src/components/wrapped/WrappedSlide.tsx`
- `src/components/wrapped/stats/*.tsx` (plusieurs composants)
- `src/lib/wrapped/utils.ts`
- `src/components/wrapped/WrappedShare.tsx`
- `src/components/wrapped/WrappedAdminBanner.tsx` - Bandeau pour les admins

### Fichiers à modifier

- `src/app/notifications/page.tsx` - Ajouter le bandeau `WrappedAdminBanner` (visible uniquement pour les admins)

## Sécurité et performance

- **Authentification**: Seuls les utilisateurs connectés peuvent voir leur wrapped
- **RLS**: Vérifier que les stats sont calculées uniquement pour l'utilisateur connecté
- **Cache**: Mettre en cache les stats calculées (éviter recalcul à chaque visite)
- **Lazy loading**: Charger les slides au fur et à mesure
- **Optimisation images**: Utiliser Next.js Image avec lazy loading

## Notes importantes

- Les dates doivent être filtrées par année calendaire (1er janvier - 31 décembre)
- Utiliser `EXTRACT(YEAR FROM ...)` pour PostgreSQL
- Gérer le cas où l'utilisateur n'a pas assez de données (message alternatif)
- Prévoir un fallback si certaines données manquent (ex: pas de sentiments, pas de tags)
- **Accès admin** : Utiliser `getCurrentUserAdminStatus()` de `@/lib/auth/admin` pour vérifier les droits
- **Bandeau notifications** : Le bandeau doit être conditionnel et ne s'afficher que pour les admins
- Le wrapped est accessible toute l'année, mais le bandeau dans notifications sert de point d'entrée privilégié pour les admins
