# Mots-clés de Ressenti (Feeling Keywords)

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'ajouter des mots-clés prédéfinis (adjectifs de ressenti) sur les fiches détail des livres. Les utilisateurs peuvent sélectionner plusieurs mots-clés pour exprimer leur avis sans avoir à écrire un commentaire complet.

## Architecture

### Base de données

#### Table `feeling_keywords`
- `id` (uuid, PK)
- `label` (text) - Le mot-clé (ex: "Émouvant")
- `slug` (text, unique) - Version slugifiée pour l'URL
- `source` (enum: 'admin' | 'user') - Origine du mot-clé
- `created_by` (uuid, FK users, nullable) - Créateur si source='user'
- `created_at`, `updated_at` (timestamptz)

#### Table `user_book_feelings`
- `id` (uuid, PK)
- `user_id` (uuid, FK users)
- `book_id` (uuid, FK books)
- `keyword_id` (uuid, FK feeling_keywords)
- `visibility` (enum: 'public' | 'friends' | 'private')
- `created_at`, `updated_at` (timestamptz)
- Unique constraint: `(user_id, book_id, keyword_id)`

### RLS Policies

- **feeling_keywords**: Lecture publique, insertion authentifiée, update par créateur/admin
- **user_book_feelings**: Lecture selon visibilité (même logique que reviews), écriture par propriétaire uniquement

## Installation

### 1. Migration SQL

Exécuter la migration dans Supabase :

```bash
# Via Supabase CLI ou l'éditeur SQL
psql -f supabase/migration-feeling-keywords.sql
```

### 2. Seed des mots-clés initiaux

Exécuter le script de seed :

```bash
pnpm tsx scripts/seed-feeling-keywords.ts
```

Cela créera 66 mots-clés prédéfinis (admin) :
- Émouvant, Captivant, Drôle, Déstabilisant, Inspirant, Poétique...
- Voir `scripts/seed-feeling-keywords.ts` pour la liste complète

## Utilisation

### Côté utilisateur

1. **Sélectionner des mots-clés** : Sur la fiche détail d'un livre, dans la section "Mots-clés ressentis", cliquer sur les badges pour sélectionner/désélectionner
2. **Ajouter un mot-clé personnalisé** : Saisir dans le champ texte et cliquer sur "Ajouter"
3. **Choisir la visibilité** : Public, Amis, ou Privée (même système que les reviews)
4. **Sauvegarder** : Cliquer sur "Sauvegarder" pour enregistrer

### Côté développeur

#### Récupérer les mots-clés disponibles

```typescript
import { getAllFeelingKeywords } from "@/features/books/server/get-book-feelings";

const keywords = await getAllFeelingKeywords();
```

#### Récupérer les feelings d'un livre

```typescript
import { getBookFeelings } from "@/features/books/server/get-book-feelings";

const feelings = await getBookFeelings(bookId, viewerId, viewerFollowingIds);
```

#### Créer un nouveau mot-clé

```typescript
import { createFeelingKeyword } from "@/server/actions/book";

const result = await createFeelingKeyword("Nouveau mot-clé");
if (result.success) {
  console.log(result.keyword);
}
```

#### Sauvegarder les feelings d'un utilisateur

```typescript
import { upsertBookFeelings } from "@/server/actions/book";

const result = await upsertBookFeelings(
  bookId,
  ["keyword-id-1", "keyword-id-2"],
  "public"
);
```

## Composants

### `BookFeelingsSection`

Composant principal affichant :
- Le sélecteur de mots-clés (`KeywordPicker`)
- Le nuage de mots-clés de la communauté (`KeywordCloud`)

**Props:**
- `bookId`: ID du livre
- `availableKeywords`: Liste de tous les mots-clés disponibles
- `viewerFeelings`: IDs des mots-clés sélectionnés par le viewer
- `viewerFeelingsVisibility`: Visibilité des feelings du viewer
- `allFeelings`: Tous les feelings visibles selon la visibilité
- `viewerId`: ID de l'utilisateur connecté (optionnel)

### `KeywordPicker`

Composant de sélection multi-choix avec :
- Badges cliquables pour sélectionner/désélectionner
- Champ texte pour ajouter un mot-clé personnalisé
- Sélecteur de visibilité
- Bouton de sauvegarde

### `KeywordCloud`

Composant d'affichage agrégé montrant :
- Badges avec compteur (ex: "Émouvant · 5")
- Tooltip avec liste des utilisateurs
- Tri par popularité puis alphabétique

## Visibilité

La visibilité fonctionne comme pour les reviews :

- **Public** : Visible par tous
- **Amis** : Visible seulement par les utilisateurs qui suivent l'auteur
- **Privée** : Visible seulement par l'auteur lui-même

## Notes techniques

- Les mots-clés sont slugifiés automatiquement (normalisation, suppression accents)
- Un utilisateur peut avoir plusieurs mots-clés pour un même livre
- La visibilité s'applique à tous les mots-clés d'un utilisateur pour un livre donné
- Les doublons de mots-clés sont évités via le slug unique
- Les mots-clés créés par les utilisateurs ont `source='user'`

## Prochaines améliorations possibles

- [ ] Statistiques agrégées par livre (mots-clés les plus fréquents)
- [ ] Filtrage de recherche par mots-clés
- [ ] Suggestions de mots-clés basées sur les autres utilisateurs
- [ ] Export des mots-clés les plus populaires
- [ ] Modération des mots-clés utilisateur

