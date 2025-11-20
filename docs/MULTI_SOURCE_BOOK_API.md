# Multi-Source Book API - Analyse et Implémentation

## 📋 Résumé Exécutif

Ce document analyse la faisabilité d'intégrer plusieurs sources d'API pour améliorer la complétude des informations sur les livres, notamment pour les livres français où OpenLibrary présente des lacunes.

**Objectif** : Implémenter un système de fallback multi-sources pour la recherche et l'import de livres, en privilégiant les sources gratuites et en utilisant Google Books uniquement en dernier recours.

---

## 🔍 Analyse de Faisabilité

### État Actuel

- **Source principale** : OpenLibrary (gratuite, illimitée)
- **Problèmes identifiés** :
  - Informations incomplètes pour les livres français
  - Certains livres n'existent pas dans OpenLibrary
  - Manque de métadonnées (description, couverture, tags)

### Structure Actuelle

- **Fichiers clés** :
  - `src/lib/open-library.ts` : Client OpenLibrary
  - `src/app/api/books/search/route.ts` : Endpoint de recherche
  - `src/server/actions/import-open-library.ts` : Action d'import
  - Table `books` avec champ `open_library_id` uniquement

- **Champs requis pour un livre** :
  - `title` (requis)
  - `author` (requis)
  - `cover_url` (optionnel)
  - `publication_year` (optionnel)
  - `summary` (optionnel)
  - `open_library_id` (optionnel, unique)

---

## 🌐 Alternatives Analysées

### 1. **MetasBooks** ⭐ (Recommandé pour livres français)

**Avantages** :
- ✅ **Gratuit** et spécialisé pour les livres français
- ✅ **1.2M+ références** avec 98% de complétude pour livres post-2015
- ✅ Formats multiples : JSON, XML, ONIX, MARC
- ✅ Système de crédits collaboratif (ajout/correction de fiches)
- ✅ Taux de délivrance élevé

**Inconvénients** :
- ⚠️ Nécessite une clé API (gratuite mais avec inscription)
- ⚠️ Principalement pour livres français
- ⚠️ Moins efficace pour livres auto-édités ou petites maisons

**Documentation** : https://metasbooks.fr

**Quotas** : À vérifier lors de l'inscription

---

### 2. **API BnF (Bibliothèque nationale de France)**

**Avantages** :
- ✅ **Gratuit** et sans restriction (sauf usage abusif)
- ✅ **14M+ documents** dans le catalogue général
- ✅ API Gallica pour documents numérisés
- ✅ data.bnf.fr pour accès unifié
- ✅ Licence ouverte (réutilisation commerciale autorisée)

**Inconvénients** :
- ⚠️ API plus complexe (plusieurs endpoints)
- ⚠️ Format de réponse peut nécessiter plus de transformation
- ⚠️ Principalement orienté documents historiques/patrimoniaux

**Documentation** :
- API BnF : https://api.bnf.fr
- data.bnf.fr : https://data.bnf.fr

**Quotas** : Aucun quota officiel (usage raisonnable)

---

### 3. **Google Books API**

**Avantages** :
- ✅ **Gratuit jusqu'à ~1000 requêtes/jour**
- ✅ Très large couverture internationale
- ✅ Métadonnées riches (ISBN, éditeur, catégories)
- ✅ API simple et bien documentée

**Inconvénients** :
- ⚠️ **Peut devenir payant** après le quota gratuit
- ⚠️ Nécessite clé API Google Cloud
- ⚠️ Attribution requise (CGU Google)
- ⚠️ Limite de 1000 requêtes/jour en gratuit

**Documentation** : https://developers.google.com/books

**Quotas** : 1000 requêtes/jour gratuites, puis facturation

---

## 🎯 Stratégie d'Implémentation Recommandée

### Ordre de Priorité (Fallback Chain)

```
1. OpenLibrary (source actuelle)
   ↓ (si pas de résultat OU données incomplètes)
2. MetasBooks (pour livres français)
   ↓ (si toujours incomplet)
3. BnF/Gallica (pour complément)
   ↓ (en dernier recours uniquement)
4. Google Books (si vraiment nécessaire)
```

### Critères de "Données Incomplètes"

Un livre est considéré comme incomplet si :
- ❌ Pas de couverture (`cover_url` manquant)
- ❌ Pas de description/résumé (`summary` manquant)
- ❌ Pas d'année de publication (`publication_year` manquant)
- ❌ Auteur manquant ou "inconnu"
- ❌ Titre manquant ou "inconnu"

**Seuil de complétude** : Au moins 3 des 5 critères doivent être remplis pour considérer le livre comme "complet".

---

## 🏗️ Architecture Proposée

### 1. Structure de Fichiers

```
src/lib/
  ├── open-library.ts          (existant)
  ├── metasbooks.ts            (nouveau)
  ├── bnf.ts                   (nouveau)
  ├── google-books.ts          (nouveau)
  └── book-sources.ts          (nouveau - orchestrateur)
```

### 2. Types Unifiés

```typescript
// src/lib/book-sources/types.ts
export type BookSource = "open_library" | "metasbooks" | "bnf" | "google_books";

export type BookMetadata = {
  id: string;
  source: BookSource;
  title: string;
  author: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  summary?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  subjects?: string[];
  completeness: number; // Score 0-100
};
```

### 3. Fonction d'Orchestration

```typescript
// src/lib/book-sources/orchestrator.ts
export const searchBooksWithFallback = async (
  query: string,
  options?: {
    preferFrench?: boolean;
    minCompleteness?: number;
  }
): Promise<BookMetadata[]>
```

### 4. Fonction de Complétion

```typescript
// src/lib/book-sources/enricher.ts
export const enrichBookMetadata = async (
  book: BookMetadata,
  sources?: BookSource[]
): Promise<BookMetadata>
```

### 5. Modification de la Base de Données

**Migration SQL nécessaire** :

```sql
-- Ajouter des colonnes pour les autres sources
ALTER TABLE books 
  ADD COLUMN IF NOT EXISTS metasbooks_id TEXT,
  ADD COLUMN IF NOT EXISTS google_books_id TEXT,
  ADD COLUMN IF NOT EXISTS bnf_id TEXT,
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS publisher TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS source_priority TEXT; -- 'open_library' | 'metasbooks' | etc.

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_books_metasbooks_id ON books(metasbooks_id);
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
```

---

## 📝 Checklist d'Implémentation

### Phase 1 : Recherche et Configuration ⏳

- [ ] **1.1** Analyser la documentation MetasBooks
  - [ ] Créer un compte de test
  - [ ] Obtenir une clé API
  - [ ] Tester les endpoints de recherche
  - [ ] Vérifier les quotas et limitations
  - [ ] Documenter le format de réponse

- [ ] **1.2** Analyser les API BnF
  - [ ] Explorer l'API Gallica Recherche
  - [ ] Explorer data.bnf.fr
  - [ ] Tester les endpoints pertinents
  - [ ] Documenter le format de réponse

- [ ] **1.3** Configurer Google Books API (si nécessaire)
  - [ ] Créer un projet Google Cloud
  - [ ] Activer Books API
  - [ ] Générer une clé API
  - [ ] Configurer les restrictions (IP, référent)
  - [ ] Tester les endpoints

- [ ] **1.4** Définir les variables d'environnement
  - [ ] `METASBOOKS_API_KEY` (optionnel)
  - [ ] `GOOGLE_BOOKS_API_KEY` (optionnel)
  - [ ] `ENABLE_GOOGLE_BOOKS_FALLBACK` (bool, default: false)
  - [ ] `MIN_BOOK_COMPLETENESS` (number, default: 60)

### Phase 2 : Développement des Clients API 🔨

- [ ] **2.1** Créer le client MetasBooks
  - [ ] `src/lib/metasbooks.ts`
  - [ ] Fonction `searchMetasBooks(query, limit)`
  - [ ] Fonction `fetchMetasBooksDetails(id)`
  - [ ] Mapping vers type `BookMetadata`
  - [ ] Gestion des erreurs et timeouts
  - [ ] Tests unitaires

- [ ] **2.2** Créer le client BnF
  - [ ] `src/lib/bnf.ts`
  - [ ] Fonction `searchBnF(query, limit)`
  - [ ] Fonction `fetchBnFDetails(id)`
  - [ ] Mapping vers type `BookMetadata`
  - [ ] Gestion des erreurs et timeouts
  - [ ] Tests unitaires

- [ ] **2.3** Créer le client Google Books
  - [ ] `src/lib/google-books.ts`
  - [ ] Fonction `searchGoogleBooks(query, limit)`
  - [ ] Fonction `fetchGoogleBooksDetails(id)`
  - [ ] Mapping vers type `BookMetadata`
  - [ ] Gestion des quotas (tracking)
  - [ ] Gestion des erreurs et timeouts
  - [ ] Tests unitaires

- [ ] **2.4** Créer le système d'orchestration
  - [ ] `src/lib/book-sources/types.ts` (types unifiés)
  - [ ] `src/lib/book-sources/orchestrator.ts` (logique de fallback)
  - [ ] `src/lib/book-sources/enricher.ts` (complétion de données)
  - [ ] `src/lib/book-sources/completeness.ts` (calcul du score)
  - [ ] Tests unitaires pour chaque module

### Phase 3 : Modification de la Base de Données 🗄️

- [ ] **3.1** Créer la migration SQL
  - [ ] Ajouter colonnes `metasbooks_id`, `google_books_id`, `bnf_id`
  - [ ] Ajouter colonnes `isbn`, `publisher`, `language`
  - [ ] Ajouter colonne `source_priority`
  - [ ] Créer les index nécessaires
  - [ ] Tester la migration sur un environnement de dev

- [ ] **3.2** Mettre à jour les types TypeScript
  - [ ] Mettre à jour les types de la table `books`
  - [ ] Adapter les requêtes Supabase existantes

### Phase 4 : Modification de l'API de Recherche 🔍

- [ ] **4.1** Modifier `/api/books/search`
  - [ ] Intégrer `searchBooksWithFallback`
  - [ ] Gérer les résultats multi-sources
  - [ ] Dédupliquer par ISBN/titre+auteur
  - [ ] Ajouter le champ `source` dans la réponse
  - [ ] Conserver la logique Supabase existante
  - [ ] Tests d'intégration

- [ ] **4.2** Mettre à jour les types de recherche
  - [ ] Étendre `SearchBook` avec nouveaux champs
  - [ ] Ajouter `source` : `"supabase" | "open_library" | "metasbooks" | "bnf" | "google_books"`
  - [ ] Mettre à jour `SearchResponse` si nécessaire

### Phase 5 : Modification de l'Import 📥

- [ ] **5.1** Refactoriser `importOpenLibraryBook`
  - [ ] Renommer en `importExternalBook`
  - [ ] Gérer les différents types de sources
  - [ ] Stocker les IDs de toutes les sources utilisées
  - [ ] Utiliser `enrichBookMetadata` pour compléter
  - [ ] Gérer les tags depuis toutes les sources

- [ ] **5.2** Mettre à jour le composant d'import
  - [ ] `ImportOpenLibraryButton` → `ImportExternalBookButton`
  - [ ] Gérer l'affichage de la source
  - [ ] Adapter les messages d'erreur

### Phase 6 : Interface Utilisateur 🎨

- [ ] **6.1** Mettre à jour les cartes de résultats
  - [ ] Afficher la source du livre (badge)
  - [ ] Indiquer si les données sont complètes
  - [ ] Adapter les messages selon la source

- [ ] **6.2** Améliorer l'UX de recherche
  - [ ] Afficher un indicateur de chargement multi-sources
  - [ ] Gérer les erreurs par source (fallback transparent)
  - [ ] Optionnel : permettre de choisir la source préférée

### Phase 7 : Monitoring et Optimisation 📊

- [ ] **7.1** Implémenter le tracking des quotas
  - [ ] Logger les appels à Google Books
  - [ ] Alerter si quota approche (80% utilisé)
  - [ ] Désactiver automatiquement Google Books si quota dépassé

- [ ] **7.2** Optimiser les performances
  - [ ] Cache des résultats (Next.js revalidate)
  - [ ] Parallélisation des appels API (quand possible)
  - [ ] Timeout par source (éviter les blocages)

- [ ] **7.3** Logging et debugging
  - [ ] Logger les sources utilisées pour chaque recherche
  - [ ] Logger les scores de complétude
  - [ ] Logger les erreurs par source

### Phase 8 : Tests et Documentation ✅

- [ ] **8.1** Tests E2E
  - [ ] Recherche avec fallback OpenLibrary → MetasBooks
  - [ ] Recherche avec fallback complet (toutes sources)
  - [ ] Import depuis chaque source
  - [ ] Gestion des erreurs (source indisponible)

- [ ] **8.2** Tests de charge
  - [ ] Vérifier les performances avec plusieurs sources
  - [ ] Tester les timeouts
  - [ ] Vérifier la gestion des quotas

- [ ] **8.3** Documentation
  - [ ] Mettre à jour `docs/API.md`
  - [ ] Mettre à jour `docs/ARCHITECTURE.md`
  - [ ] Documenter les variables d'environnement
  - [ ] Créer un guide de dépannage

### Phase 9 : Déploiement 🚀

- [ ] **9.1** Préparation
  - [ ] Configurer les variables d'environnement en production
  - [ ] Tester sur un environnement de staging
  - [ ] Vérifier les quotas et limites

- [ ] **9.2** Déploiement progressif
  - [ ] Activer MetasBooks en premier
  - [ ] Activer BnF ensuite
  - [ ] Activer Google Books uniquement si nécessaire
  - [ ] Monitorer les métriques

- [ ] **9.3** Post-déploiement
  - [ ] Surveiller les logs
  - [ ] Vérifier les quotas Google Books
  - [ ] Collecter les retours utilisateurs
  - [ ] Ajuster les paramètres si nécessaire

---

## ⚠️ Risques et Contraintes

### Risques Identifiés

1. **Quotas Google Books**
   - **Risque** : Dépassement du quota gratuit (1000 req/jour)
   - **Mitigation** : Monitoring actif, désactivation automatique, utiliser en dernier recours

2. **Complexité de l'Orchestration**
   - **Risque** : Code complexe, difficile à maintenir
   - **Mitigation** : Architecture modulaire, tests complets, documentation

3. **Performance**
   - **Risque** : Latence accrue avec plusieurs appels API
   - **Mitigation** : Parallélisation, cache, timeouts

4. **Coûts**
   - **Risque** : Google Books peut devenir payant
   - **Mitigation** : Utilisation uniquement en dernier recours, monitoring strict

### Contraintes Techniques

- **Compatibilité** : Maintenir la compatibilité avec le code existant
- **Base de données** : Migration nécessaire pour nouveaux champs
- **API** : Respecter les CGU de chaque service (attribution Google Books)

---

## 📊 Métriques de Succès

- ✅ **Complétude des données** : +30% de livres avec description complète
- ✅ **Couverture française** : +50% de livres français trouvés
- ✅ **Performance** : Temps de réponse < 2s pour recherche multi-sources
- ✅ **Coûts** : 0€ de coût Google Books (rester sous quota gratuit)

---

## 🔄 Questions à Résoudre

### Avant de Commencer

1. **MetasBooks** :
   - [ ] Quelle est la procédure d'inscription exacte ?
   - [ ] Y a-t-il des quotas ou limitations ?
   - [ ] Le format de réponse est-il stable ?

2. **BnF** :
   - [ ] Quel endpoint est le plus adapté pour notre usage ?
   - [ ] Le format de réponse nécessite-t-il beaucoup de transformation ?
   - [ ] Y a-t-il des exemples de requêtes pour livres récents ?

3. **Google Books** :
   - [ ] Souhaitez-vous activer Google Books dès le début ou seulement si nécessaire ?
   - [ ] Quel budget maximum pour Google Books (si dépassement) ?

4. **Priorités** :
   - [ ] Quelle source prioriser pour les livres français ?
   - [ ] Faut-il activer toutes les sources d'un coup ou progressivement ?

---

## 📚 Ressources

- [MetasBooks](https://metasbooks.fr)
- [API BnF](https://api.bnf.fr)
- [data.bnf.fr](https://data.bnf.fr)
- [Google Books API](https://developers.google.com/books)
- [Documentation OpenLibrary](https://openlibrary.org/developers/api)

---

**Date de création** : 2024  
**Dernière mise à jour** : 2024  
**Statut** : 📋 En attente de validation

