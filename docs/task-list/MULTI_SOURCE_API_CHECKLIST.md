# Checklist - Multi-Source Book API

## 📋 Vue d'ensemble

Cette checklist suit l'avancement de l'implémentation du système multi-sources pour la recherche et l'import de livres.

**Documentation complète** : Voir [MULTI_SOURCE_BOOK_API.md](../MULTI_SOURCE_BOOK_API.md)

---

## Phase 1 : Recherche et Configuration

### MetasBooks
- [ ] Créer un compte MetasBooks
- [ ] Obtenir une clé API
- [ ] Tester l'endpoint de recherche
- [ ] Tester l'endpoint de détails
- [ ] Documenter le format de réponse
- [ ] Vérifier les quotas et limitations
- [ ] Noter les informations de connexion (clé API, base URL)

### API BnF
- [ ] Explorer l'API Gallica Recherche
- [ ] Explorer data.bnf.fr
- [ ] Identifier les endpoints pertinents
- [ ] Tester les endpoints de recherche
- [ ] Documenter le format de réponse
- [ ] Vérifier les quotas et limitations

### Google Books (optionnel)
- [ ] Créer un projet Google Cloud
- [ ] Activer Books API
- [ ] Générer une clé API
- [ ] Configurer les restrictions
- [ ] Tester les endpoints
- [ ] Documenter les quotas (1000 req/jour)

### Configuration
- [ ] Ajouter `METASBOOKS_API_KEY` dans `.env.local`
- [ ] Ajouter `GOOGLE_BOOKS_API_KEY` dans `.env.local` (si activé)
- [ ] Ajouter `ENABLE_GOOGLE_BOOKS_FALLBACK=false` dans `.env.local`
- [ ] Ajouter `MIN_BOOK_COMPLETENESS=60` dans `.env.local`
- [ ] Documenter les variables dans le README

**Statut Phase 1** : ⏳ Non commencé

---

## Phase 2 : Développement des Clients API

### Client MetasBooks
- [ ] Créer `src/lib/metasbooks.ts`
- [ ] Implémenter `searchMetasBooks(query, limit)`
- [ ] Implémenter `fetchMetasBooksDetails(id)`
- [ ] Créer le mapping vers `BookMetadata`
- [ ] Gérer les erreurs et timeouts
- [ ] Ajouter les tests unitaires
- [ ] Tester avec des livres français réels

### Client BnF
- [ ] Créer `src/lib/bnf.ts`
- [ ] Implémenter `searchBnF(query, limit)`
- [ ] Implémenter `fetchBnFDetails(id)`
- [ ] Créer le mapping vers `BookMetadata`
- [ ] Gérer les erreurs et timeouts
- [ ] Ajouter les tests unitaires
- [ ] Tester avec des livres français réels

### Client Google Books
- [ ] Créer `src/lib/google-books.ts`
- [ ] Implémenter `searchGoogleBooks(query, limit)`
- [ ] Implémenter `fetchGoogleBooksDetails(id)`
- [ ] Créer le mapping vers `BookMetadata`
- [ ] Implémenter le tracking des quotas
- [ ] Gérer les erreurs et timeouts
- [ ] Ajouter les tests unitaires

### Système d'Orchestration
- [ ] Créer `src/lib/book-sources/types.ts`
- [ ] Créer `src/lib/book-sources/orchestrator.ts`
- [ ] Implémenter `searchBooksWithFallback()`
- [ ] Créer `src/lib/book-sources/enricher.ts`
- [ ] Implémenter `enrichBookMetadata()`
- [ ] Créer `src/lib/book-sources/completeness.ts`
- [ ] Implémenter le calcul du score de complétude
- [ ] Ajouter les tests unitaires pour chaque module

**Statut Phase 2** : ⏳ Non commencé

---

## Phase 3 : Modification de la Base de Données

### Migration SQL
- [ ] Créer le fichier de migration SQL
- [ ] Ajouter colonne `metasbooks_id TEXT`
- [ ] Ajouter colonne `google_books_id TEXT`
- [ ] Ajouter colonne `bnf_id TEXT`
- [ ] Ajouter colonne `isbn TEXT`
- [ ] Ajouter colonne `publisher TEXT`
- [ ] Ajouter colonne `language TEXT`
- [ ] Ajouter colonne `source_priority TEXT`
- [ ] Créer index `idx_books_metasbooks_id`
- [ ] Créer index `idx_books_google_books_id`
- [ ] Créer index `idx_books_isbn`
- [ ] Tester la migration sur environnement de dev
- [ ] Vérifier la compatibilité avec les données existantes

### Types TypeScript
- [ ] Mettre à jour les types de la table `books`
- [ ] Adapter les requêtes Supabase existantes
- [ ] Vérifier la compilation TypeScript

**Statut Phase 3** : ⏳ Non commencé

---

## Phase 4 : Modification de l'API de Recherche

### Endpoint `/api/books/search`
- [ ] Intégrer `searchBooksWithFallback` dans la route
- [ ] Gérer les résultats multi-sources
- [ ] Implémenter la déduplication par ISBN
- [ ] Implémenter la déduplication par titre+auteur
- [ ] Ajouter le champ `source` dans la réponse
- [ ] Conserver la logique Supabase existante
- [ ] Gérer les erreurs par source (fallback transparent)
- [ ] Ajouter les tests d'intégration

### Types de Recherche
- [ ] Étendre `SearchBook` avec nouveaux champs
- [ ] Ajouter `source` : `"supabase" | "open_library" | "metasbooks" | "bnf" | "google_books"`
- [ ] Mettre à jour `SearchResponse` si nécessaire
- [ ] Vérifier la compatibilité avec le frontend

**Statut Phase 4** : ⏳ Non commencé

---

## Phase 5 : Modification de l'Import

### Action d'Import
- [ ] Renommer `importOpenLibraryBook` → `importExternalBook`
- [ ] Gérer les différents types de sources
- [ ] Stocker les IDs de toutes les sources utilisées
- [ ] Utiliser `enrichBookMetadata` pour compléter
- [ ] Gérer les tags depuis toutes les sources
- [ ] Conserver la compatibilité avec les imports OpenLibrary existants
- [ ] Ajouter les tests

### Composant d'Import
- [ ] Renommer `ImportOpenLibraryButton` → `ImportExternalBookButton`
- [ ] Gérer l'affichage de la source
- [ ] Adapter les messages d'erreur
- [ ] Mettre à jour les imports dans les composants
- [ ] Tester l'import depuis chaque source

**Statut Phase 5** : ⏳ Non commencé

---

## Phase 6 : Interface Utilisateur

### Cartes de Résultats
- [ ] Afficher la source du livre (badge)
- [ ] Indiquer si les données sont complètes (indicateur visuel)
- [ ] Adapter les messages selon la source
- [ ] Tester l'affichage avec différentes sources

### UX de Recherche
- [ ] Afficher un indicateur de chargement multi-sources
- [ ] Gérer les erreurs par source (fallback transparent)
- [ ] Optionnel : permettre de choisir la source préférée
- [ ] Tester l'expérience utilisateur complète

**Statut Phase 6** : ⏳ Non commencé

---

## Phase 7 : Monitoring et Optimisation

### Tracking des Quotas
- [ ] Implémenter le logging des appels Google Books
- [ ] Créer un système d'alerte (80% quota utilisé)
- [ ] Désactiver automatiquement Google Books si quota dépassé
- [ ] Créer un dashboard de monitoring (optionnel)

### Optimisation Performance
- [ ] Implémenter le cache des résultats (Next.js revalidate)
- [ ] Paralléliser les appels API (quand possible)
- [ ] Implémenter les timeouts par source
- [ ] Mesurer les performances avant/après

### Logging et Debugging
- [ ] Logger les sources utilisées pour chaque recherche
- [ ] Logger les scores de complétude
- [ ] Logger les erreurs par source
- [ ] Créer des logs structurés pour faciliter le debugging

**Statut Phase 7** : ⏳ Non commencé

---

## Phase 8 : Tests et Documentation

### Tests E2E
- [ ] Test : Recherche avec fallback OpenLibrary → MetasBooks
- [ ] Test : Recherche avec fallback complet (toutes sources)
- [ ] Test : Import depuis MetasBooks
- [ ] Test : Import depuis BnF
- [ ] Test : Import depuis Google Books
- [ ] Test : Gestion des erreurs (source indisponible)
- [ ] Test : Déduplication par ISBN
- [ ] Test : Complétion de données incomplètes

### Tests de Charge
- [ ] Vérifier les performances avec plusieurs sources
- [ ] Tester les timeouts
- [ ] Vérifier la gestion des quotas
- [ ] Tester avec un volume élevé de requêtes

### Documentation
- [ ] Mettre à jour `docs/API.md`
- [ ] Mettre à jour `docs/ARCHITECTURE.md`
- [ ] Documenter les variables d'environnement dans README
- [ ] Créer un guide de dépannage
- [ ] Documenter les exemples d'utilisation

**Statut Phase 8** : ⏳ Non commencé

---

## Phase 9 : Déploiement

### Préparation
- [ ] Configurer les variables d'environnement en production
- [ ] Tester sur un environnement de staging
- [ ] Vérifier les quotas et limites
- [ ] Préparer le plan de rollback

### Déploiement Progressif
- [ ] Activer MetasBooks en premier
- [ ] Monitorer les métriques (24h)
- [ ] Activer BnF ensuite
- [ ] Monitorer les métriques (24h)
- [ ] Activer Google Books uniquement si nécessaire
- [ ] Monitorer les quotas Google Books

### Post-Déploiement
- [ ] Surveiller les logs
- [ ] Vérifier les quotas Google Books quotidiennement
- [ ] Collecter les retours utilisateurs
- [ ] Ajuster les paramètres si nécessaire
- [ ] Documenter les leçons apprises

**Statut Phase 9** : ⏳ Non commencé

---

## 📊 Progression Globale

**Phases complétées** : 0 / 9  
**Tâches complétées** : 0 / ~100  
**Statut global** : ⏳ Non commencé

---

## 🎯 Prochaines Étapes

1. **Valider le document d'analyse** : [MULTI_SOURCE_BOOK_API.md](../MULTI_SOURCE_BOOK_API.md)
2. **Répondre aux questions** dans la section "Questions à Résoudre"
3. **Commencer Phase 1** : Recherche et Configuration

---

## 📝 Notes

- Cette checklist sera mise à jour au fur et à mesure de l'avancement
- Cocher les cases au fur et à mesure de la complétion
- Ajouter des notes si nécessaire pour chaque phase

