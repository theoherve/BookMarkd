# Configuration Google Books API

## 📋 Instructions d'Activation

Ce guide vous explique comment activer et configurer Google Books API pour BookMarkd.

---

## 🎯 Vue d'ensemble

BookMarkd utilise **Google Books API en priorité** pour les recherches externes de livres, avec un fallback automatique vers **OpenLibrary** si :
- Le quota quotidien est atteint (950 requêtes/jour)
- Google Books ne retourne pas de résultats
- L'API key n'est pas configurée

**Quota gratuit** : 1000 requêtes/jour  
**Limite de sécurité** : 950 requêtes/jour (pour éviter tout dépassement)

---

## 🔧 Étapes d'Activation

### 1. Créer un Projet Google Cloud

1. Accédez à la [Console Google Cloud](https://console.cloud.google.com/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Sélectionner un projet"** en haut
4. Cliquez sur **"Nouveau projet"**
5. Remplissez le formulaire :
   - **Nom du projet** : `BookMarkd` (ou un nom de votre choix)
   - **Organisation** : (laisser vide si pas d'organisation)
6. Cliquez sur **"Créer"**

### 2. Activer l'API Google Books

1. Dans votre projet Google Cloud, accédez à **"API et services"** > **"Bibliothèque"**
2. Dans la barre de recherche, tapez **"Books API"**
3. Sélectionnez **"Google Books API"**
4. Cliquez sur **"Activer"**
5. Attendez quelques instants que l'API soit activée

### 3. Créer une Clé API

1. Accédez à **"API et services"** > **"Identifiants"**
2. Cliquez sur **"Créer des identifiants"** > **"Clé API"**
3. Une clé API sera générée automatiquement
4. **⚠️ IMPORTANT** : Cliquez sur **"Restreindre la clé"** pour sécuriser votre clé

#### Configuration des Restrictions (⚠️ IMPORTANT pour appels serveur)

**⚠️ IMPORTANT** : Les appels API se font depuis votre **serveur Next.js** (Route Handler), pas depuis le navigateur. Il n'y a donc **pas de referer HTTP**, ce qui bloque les requêtes si vous restreignez par HTTP referrer.

**Option 1 : Pas de restriction HTTP referrer (Recommandé pour développement/production)**

**Restrictions d'application** :
- Sélectionnez **"Aucune restriction"** (pour les appels serveur)
- OU si vous avez une IP fixe, sélectionnez **"Adresses IP"** et ajoutez l'IP de votre serveur

**Restrictions d'API** :
- Sélectionnez **"Restreindre la clé"**
- Cochez uniquement **"Google Books API"**
- Cliquez sur **"Enregistrer"**

**Option 2 : Restriction par IP (si vous avez une IP fixe)**

Si vous déployez sur un serveur avec IP fixe (VPS, etc.) :
- Sélectionnez **"Adresses IP"**
- Ajoutez l'IP de votre serveur de production
- ⚠️ Ne fonctionne pas pour Vercel/Netlify (IP dynamiques)

**Option 3 : Pas de restriction (moins sécurisé)**

Si vous voulez tester rapidement :
- Laissez **"Aucune restriction"** partout
- ⚠️ **Moins sécurisé** : n'importe qui avec votre clé peut l'utiliser

**⚠️ Ne pas utiliser** : "Applications Web" avec restrictions HTTP referrer pour les appels serveur (cela bloque les requêtes)

### 4. Configurer la Variable d'Environnement

1. Ouvrez votre fichier `.env.local` à la racine du projet
2. Ajoutez la variable suivante :

```env
GOOGLE_BOOKS_API_KEY=votre_clé_api_ici
```

**Exemple** :
```env
GOOGLE_BOOKS_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz
```

3. Sauvegardez le fichier
4. Redémarrez votre serveur de développement (`pnpm dev`)

### 5. Exécuter la Migration SQL

⚠️ **Important** : Avant de pouvoir utiliser Google Books, vous devez exécuter la migration SQL pour créer la table de tracking des quotas.

1. Accédez à votre projet Supabase
2. Allez dans **"SQL Editor"**
3. Créez une nouvelle requête
4. Ouvrez le fichier `supabase/migration-google-books.sql`
5. Copiez tout le contenu du fichier
6. Collez-le dans l'éditeur SQL Supabase
7. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`

Cette migration va :
- Ajouter les colonnes nécessaires à la table `books` (google_books_id, isbn, publisher, language)
- Créer la table `google_books_quota` pour suivre les quotas
- Créer les index nécessaires

### 6. Vérifier la Configuration

1. Redémarrez votre serveur de développement
2. Allez sur la page de recherche de votre application
3. Effectuez une recherche de livre
4. Les résultats Google Books devraient apparaître en priorité (avec le badge "Google Books")

---

## 🔍 Vérification du Fonctionnement

### Test de Recherche

1. Allez sur `/search`
2. Recherchez un livre (ex: "Le Petit Prince")
3. Les résultats devraient afficher :
   - **En priorité** : Résultats Google Books (badge "Google Books")
   - **Si quota atteint ou pas de résultats** : Résultats OpenLibrary (badge "Open Library")

### Vérifier le Quota

Pour vérifier le nombre de requêtes utilisées aujourd'hui :

1. Accédez à votre base de données Supabase
2. Exécutez la requête suivante :

```sql
SELECT 
  date, 
  request_count 
FROM google_books_quota 
WHERE date = CURRENT_DATE;
```

Le résultat devrait afficher le nombre de requêtes utilisées aujourd'hui.

### Vérifier les Logs

Dans les logs de votre application, vous devriez voir :
- `[google-books]` : Logs de recherche Google Books
- `[google-books-quota]` : Logs de tracking des quotas

---

## 🚨 Gestion du Quota

### Comportement Automatique

L'application gère automatiquement le quota :

1. **Avant chaque requête** : Vérifie si le quota est < 950
2. **Si quota OK** : Fait la requête Google Books et incrémente le compteur
3. **Si quota atteint** : Bascule automatiquement vers OpenLibrary
4. **Le quota se réinitialise** : À minuit (heure UTC)

### Alerte Quota

Si le quota approche de la limite (950), vous verrez des avertissements dans les logs :

```
[google-books-quota] Quota limit reached: 950/950
[books/search] Google Books quota limit reached, falling back to OpenLibrary
```

### Vérifier le Quota dans Google Cloud

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **"API et services"** > **"Tableau de bord"**
3. Sélectionnez **"Google Books API"**
4. Consultez les statistiques d'utilisation

---

## 🛠️ Dépannage

### Problème : "API key not configured"

**Solution** :
- Vérifiez que `GOOGLE_BOOKS_API_KEY` est bien définie dans `.env.local`
- Redémarrez le serveur de développement
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé

### Problème : "API key not valid" ou "Requests from referer <empty> are blocked"

**Symptômes** :
- Erreur `403 Forbidden` avec `API_KEY_HTTP_REFERRER_BLOCKED`
- Message : "Requests from referer <empty> are blocked."

**Cause** :
- Les restrictions HTTP referrer bloquent les appels depuis le serveur (pas de referer HTTP)

**Solution** :
1. Allez dans Google Cloud Console > API et services > Identifiants
2. Cliquez sur votre clé API
3. Dans **"Restrictions d'application"** :
   - Changez de **"Applications Web"** vers **"Aucune restriction"** (pour développement)
   - OU utilisez **"Adresses IP"** si vous avez une IP fixe
4. Cliquez sur **"Enregistrer"**
5. Attendez 1-2 minutes que les changements se propagent
6. Redémarrez votre serveur de développement

### Problème : "Quota exceeded"

**Solution** :
- Le quota gratuit est de 1000 req/jour
- L'application bascule automatiquement vers OpenLibrary à 950 req
- Attendez le lendemain pour que le quota se réinitialise
- Ou utilisez uniquement OpenLibrary en retirant la clé API

### Problème : "Table google_books_quota does not exist"

**Solution** :
- Exécutez la migration SQL (`supabase/migration-google-books.sql`)
- Vérifiez que la table existe dans Supabase

### Problème : Aucun résultat Google Books

**Causes possibles** :
- Le quota est atteint (fallback automatique vers OpenLibrary)
- La clé API n'est pas configurée
- L'API Google Books est désactivée
- Les restrictions de la clé API bloquent les requêtes

---

## 📊 Monitoring

### Logs à Surveiller

Dans les logs de votre application, surveillez :
- `[google-books] search error` : Erreurs de recherche
- `[google-books-quota]` : Problèmes de quota
- `[books/search] Google Books quota limit reached` : Quota atteint

### Métriques

Pour suivre l'utilisation de Google Books, vous pouvez :

1. **Vérifier les logs Supabase** : Requêtes vers `google_books_quota`
2. **Google Cloud Console** : Statistiques d'utilisation de l'API
3. **Logs de l'application** : Compteur de requêtes par jour

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne commitez JAMAIS** votre clé API dans Git
2. **Restreignez votre clé API** (applications web, IPs, API spécifique)
3. **Utilisez des variables d'environnement** (`.env.local` pour dev, variables d'environnement pour prod)
4. **Surveillez l'utilisation** du quota quotidiennement

### Variables d'Environnement

**Développement** (`.env.local`) :
```env
GOOGLE_BOOKS_API_KEY=votre_clé_dev
```

**Production** (variables d'environnement Supabase/Vercel/etc.) :
```env
GOOGLE_BOOKS_API_KEY=votre_clé_prod
```

---

## ✅ Checklist d'Activation

- [ ] Projet Google Cloud créé
- [ ] API Google Books activée
- [ ] Clé API créée et restreinte
- [ ] Variable `GOOGLE_BOOKS_API_KEY` ajoutée dans `.env.local`
- [ ] Migration SQL exécutée (`migration-google-books.sql`)
- [ ] Serveur redémarré
- [ ] Test de recherche effectué
- [ ] Résultats Google Books visibles
- [ ] Quota vérifié dans Supabase

---

## 📚 Ressources

- [Documentation Google Books API](https://developers.google.com/books)
- [Console Google Cloud](https://console.cloud.google.com/)
- [Guide d'authentification Google](https://developers.google.com/identity/protocols/oauth2)

---

## 💡 Notes Importantes

- **Quota gratuit** : 1000 requêtes/jour
- **Limite de sécurité** : 950 requêtes/jour (pour éviter tout dépassement)
- **Fallback automatique** : OpenLibrary si quota atteint ou pas de résultats
- **Réinitialisation** : Le quota se réinitialise à minuit UTC
- **Pas de facturation** : Tant que vous restez sous 1000 req/jour

---

**Date de création** : 2024  
**Dernière mise à jour** : 2024

