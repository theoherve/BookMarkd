---
name: Boost SEO BookMarkd
overview: Analyse de l’état actuel du SEO (metadata, sitemap, robots, partage social, données structurées) et plan concret pour l’améliorer avec Next.js App Router.
todos: []
isProject: false
---

# Analyse et plan SEO pour BookMarkd

## État actuel

### Déjà en place

- **Metadata racine** (`[src/app/layout.tsx](src/app/layout.tsx)`) : `metadataBase` ([https://bookmarkd.app](https://bookmarkd.app)), `title` avec template `%s · BookMarkd`, `description`, `keywords`, `manifest`, `icons`, `viewport`, `themeColor`, `authors`.
- **Page livre** (`[src/app/books/[slug]/page.tsx](src/app/books/[slug]/page.tsx)`) : `generateMetadata` avec `title` et `description` uniquement.
- **Auth** : `metadata` sur login et signup (titre + description).
- **Langue** : `<html lang="fr">` correct.

### Manques identifiés


| Élément                           | Statut                                                             |
| --------------------------------- | ------------------------------------------------------------------ |
| **Sitemap**                       | Absent (aucun `sitemap.ts`)                                        |
| **robots.txt**                    | Absent (aucun `robots.ts`)                                         |
| **Open Graph**                    | Aucun `openGraph` (partage Facebook/LinkedIn, etc.)                |
| **Twitter Card**                  | Aucun `twitter` (partage Twitter/X)                                |
| **Image de partage**              | Pas d’`og:image` (ni défaut, ni par page livre)                    |
| **URL canonique**                 | Pas de `alternates.canonical` (livres accessibles en slug ou UUID) |
| **Données structurées (JSON-LD)** | Aucun schéma Book / WebSite / Organization                         |
| **Metadata dynamiques**           | Profils publics et listes sans `generateMetadata`                  |


---

## Moyens pour booster le SEO

### 1. Sitemap (découvrabilité et indexation)

Next.js 13+ permet un **sitemap dynamique** via `app/sitemap.ts` qui retourne un tableau d’URLs.

- **URLs statiques** : `/`, `/blog`, `/feed`, `/search`, `/lists`, `/login`, `/signup`, et si vous les créez `/about`, `/features`, `/faq` (selon ce que vous voulez indexer).
- **URLs dynamiques livres** : requête sur la table `books` (ex. `id`, `title`, `author`), construction du slug avec `generateBookSlug(title, author)` existant dans `[src/lib/slug.ts](src/lib/slug.ts)`, et entrées `url`, `lastModified` (ex. `updated_at` si disponible), `changeFrequency`, `priority`.
- **URLs dynamiques blog** : lecture des articles (fichiers MD/MDX ou source de contenu) pour lister les slugs et ajouter `/blog/[slug]` avec `lastModified` depuis le frontmatter.
- **Optionnel** : profils publics (`/profiles/[username]`) et listes publiques (`/lists/[listId]`) si vous souhaitez qu’ils soient indexés.

Cela permet aux moteurs de découvrir toutes les pages livres et d’améliorer l’indexation.

### 2. robots.txt (contrôle du crawl)

Fichier `**app/robots.ts` (Next.js génère `/robots.txt` automatiquement).

- **Allow** : `/`, `/books/`, `/profiles/`, `/lists/`, `/search`, etc.
- **Disallow** (recommandé) : `/api/`, `/profiles/me`, `/notifications`, `/offline`, routes d’auth si vous ne voulez pas les indexer.
- **Sitemap** : `https://bookmarkd.app/sitemap.xml`.
- **Crawlers IA** : pour être cité dans ChatGPT Search, ne pas bloquer **OAI-SearchBot**. Dans `robots.ts`, soit ne pas mentionner OAI-SearchBot (il suit les règles par défaut), soit ajouter explicitement `User-agent: OAI-SearchBot` avec `Allow: /` sur les zones à indexer. Voir la section “Moteurs IA” plus bas pour le détail.

Cela évite de gaspiller du crawl sur des pages non pertinentes, indique le sitemap, et permet l’indexation par les moteurs IA.

### 3. Open Graph et Twitter Card (partage social et “SEO social”)

- **Layout racine** : ajouter `openGraph` et `twitter` avec :
  - **Image par défaut** : une image dédiée (ex. `public/og-default.png` 1200×630) ou fallback sur `logo.svg` / PWA icon (certains réseaux préfèrent PNG/JPEG).
  - `metadataBase` est déjà défini, donc les URLs d’images seront absolues.
  - Champs : `title`, `description`, `images`, `siteName`, `locale: 'fr_FR'`, `type: 'website'`.
  - Twitter : `card: 'summary_large_image'`, `title`, `description`, `images`.
- **Page livre** : dans `generateMetadata`, ajouter :
  - **openGraph** / **twitter** : titre, description, **image = couverture du livre** (via `getBookCoverUrl(book.id, book.cover_url)` déjà utilisé côté page), `url` = URL canonique de la fiche.
  - **URL canonique** : `alternates.canonical` = `https://bookmarkd.app/books/${slug}` (slug “propre” après redirection UUID → slug), pour éviter contenu dupliqué.
- **Profils publics** (si partage souhaité) : `generateMetadata` avec titre (ex. “{displayName} · BookMarkd”), description, image optionnelle (avatar), canonical.
- **Listes publiques** (optionnel) : idem avec titre de la liste et description.

Résultat : liens partagés avec bon titre, description et image (livre = couverture), et moteurs qui s’appuient sur une URL canonique unique.

### 4. Données structurées (JSON-LD)

- **Page livre** : schéma **Book** (schema.org) :
  - `name`, `author` (Person ou string), `image` (URL de la couverture), `description`, `aggregateRating` (si `average_rating` / `ratings_count` présents), éventuellement `datePublished` si `publication_year` disponible.
  - Injection via un composant qui rend un `<script type="application/ld+json">` dans le layout de la page ou dans la page livre.
- **Page d’accueil** (optionnel) : schéma **WebSite** avec `url`, `name`, `description`, et `potentialAction` de type **SearchAction** (URL de recherche) pour permettre une “search box” dans les résultats Google.
- **Layout ou footer** (optionnel) : schéma **Organization** pour la marque.

Cela améliore l’éligibilité aux rich results (livres, site, organisation) et la compréhension du contenu par les moteurs.

### 5. Metadata par page (titres et descriptions uniques)

- **Homepage** : garder l’héritage du layout ou définir un `metadata` explicite (titre / description orientés “accueil”).
- **Profils** `[src/app/profiles/[username]/page.tsx](src/app/profiles/[username]/page.tsx)` : `generateMetadata` qui appelle `getPublicProfile(username)` et retourne `title`, `description` (ex. “Profil de {displayName} sur BookMarkd – X livres, …”).
- **Listes** `[src/app/lists/[listId]/page.tsx](src/app/lists/[listId]/page.tsx)` : `generateMetadata` qui appelle `getListDetail(listId)` (en lecture seule si besoin) et retourne `title` / `description` pour les listes publiques ; pour les listes privées, titre générique ou noindex (voir ci‑dessous).

Cela évite des titres vides ou dupliqués et améliore le clic dans les SERPs.

### 6. Contrôle d’indexation (robots par page)

- **Pages privées ou personnelles** : dans `generateMetadata`, ajouter `robots: { index: false, follow: false }` pour `/profiles/me`, `/notifications`, listes privées, etc.
- **robots.txt** (déjà évoqué) : complément pour bloquer des segments de routes.

Cela évite d’indexer des pages sans valeur pour la recherche.

### 7. Qualité des contenus et technique (recommandations)

- **Keywords** dans le layout : retirer les mots purement techniques (“Next.js”, “TailwindCSS”) et privilégier des termes utilisateur (“livres”, “recommandations lecture”, “réseau social lecture”, “suivi de lecture”, “liste de livres”).
- **Descriptions** : garder des meta descriptions uniques et sous ~155–160 caractères pour les pages importantes (livres, accueil, profils).
- **Performance** : déjà gérée en partie (PWA, images). S’assurer que les images de couverture utilisées en OG/JSON-LD sont servies en HTTPS et accessibles sans auth (déjà le cas pour les URLs publiques de couvertures).
- **Domaine** : `metadataBase` est déjà sur [https://bookmarkd.app](https://bookmarkd.app) ; vérifier que le déploiement et la config DNS (redirect www → non-www ou l’inverse) sont cohérents et qu’une seule version est canonique.

---

## Ordre d’implémentation suggéré

1. **robots.ts** (dont règles OAI-SearchBot / GPTBot si besoin) et **sitemap.ts** (inclure /blog et /blog/[slug] une fois le blog en place).
2. **Open Graph + Twitter** au layout (image par défaut + champs communs).
3. **Page livre** : canonical, OG/twitter avec couverture, puis JSON-LD Book.
4. **generateMetadata** pour profils et listes (avec noindex pour pages privées si besoin).
5. **WebSite / SearchAction** et **Organization** (optionnel).
6. **Blog** : structure `app/blog/` + `app/blog/[slug]/`, contenu MD/MDX, 2–3 premiers articles (ex. Top 10 livres 2024, Organiser sa PAL, Journal de lecture), metadata + JSON-LD Article par article, lien “Blog” dans la nav et le footer.
7. **Pages complémentaires** : À propos, éventuellement Fonctionnalités et FAQ (avec schéma FAQPage).
8. **Maillage interne** : breadcrumbs (livre, blog, profils, listes), footer avec Accueil, Blog, Recherche, Listes, À propos, CGU.
9. Ajustement des **keywords** et vérification des descriptions.

---

## Fichiers principaux à créer ou modifier

- **Créer** : `[src/app/sitemap.ts](src/app/sitemap.ts)`, `[src/app/robots.ts](src/app/robots.ts)` (avec règles OAI-SearchBot pour ChatGPT Search).
- **Créer (blog)** : `[src/app/blog/page.tsx](src/app/blog/page.tsx)` (liste des articles), `[src/app/blog/[slug]/page.tsx](src/app/blog/[slug]/page.tsx)` (article avec generateMetadata + JSON-LD Article), dossier `content/blog/` (ou équivalent) avec fichiers MD/MDX pour les posts (ex. `top-10-livres-2024.md`, `organiser-pal-listes.md`, `journal-lecture-2025.md`), et utilitaire de lecture des posts (ex. `src/lib/blog.ts` ou `src/features/blog/`).
- **Créer (pages SEO)** : `[src/app/about/page.tsx](src/app/about/page.tsx)` (À propos), optionnel `[src/app/features/page.tsx](src/app/features/page.tsx)` (Fonctionnalités), optionnel `[src/app/faq/page.tsx](src/app/faq/page.tsx)` (FAQ avec schéma FAQPage).
- **Modifier** : `[src/app/layout.tsx](src/app/layout.tsx)` (openGraph, twitter, keywords), `[src/app/books/[slug]/page.tsx](src/app/books/[slug]/page.tsx)` (metadata enrichie, canonical, JSON-LD), `[src/app/profiles/[username]/page.tsx](src/app/profiles/[username]/page.tsx)` (generateMetadata), `[src/app/lists/[listId]/page.tsx](src/app/lists/[listId]/page.tsx)` (generateMetadata si listes publiques indexées). Navigation / footer : ajouter liens Blog, À propos, FAQ.
- **Maillage interne** : composant breadcrumb (livre, blog, profils, listes), footer avec Accueil, Blog, Recherche, Listes, À propos, CGU.
- **Assets** : image OG par défaut (ex. `public/og-default.png` 1200×630) ; optionnel image OG par article de blog.

---

## Résumé des bénéfices

- **Sitemap + robots** : meilleure découverte et contrôle du crawl.
- **OG + Twitter + canonical** : meilleur partage social et réduction du duplicate content.
- **JSON-LD Book (et éventuellement WebSite)** : rich results et meilleure compréhension du contenu.
- **Metadata cohérentes** sur toutes les pages cibles : meilleur taux de clic et pertinence dans les résultats de recherche.
- **Blog** : contenu linkable (tops, guides, use cases), backlinks naturels, JSON-LD Article, maillage vers l’app (livres, listes, recherche), partage sur les réseaux et partenariats.
- **Pages À propos / FAQ / Fonctionnalités** : ancres pour le netlinking, contenu texte pour les moteurs IA, schéma FAQ pour rich results Google.
- **Backlinks + maillage interne** : remontée dans Google via le blog et les liens externes, plus une circulation interne claire (breadcrumbs, footer, liens livres/profils/listes/blog).
- **Moteurs IA (ChatGPT, etc.)** : autoriser OAI-SearchBot dans robots.txt, sitemap + JSON-LD + contenu lisible (dont blog), et soumission Bing/Google pour maximiser les chances d’être cité dans les réponses IA.

Si vous précisez le nom de domaine exact (bookmarkd.app ou autre) et quelles pages doivent être indexées (ex. listes publiques, profils), le plan peut être ajusté en conséquence (priorités et champs `robots`).

---

## Liens pour remonter dans Google (netlinking + maillage interne)

Les backlinks (liens externes vers votre site) sont un signal fort pour Google. Le maillage interne (liens entre vos pages) répartit la “puissance” et aide le crawl.

### Blog éditorial sur le site (contenu linkable + SEO)

Ajouter une section **Blog** dans le site pour héberger du contenu éditorial optimisé SEO, partageable et citable par d’autres sites (backlinks) et par les moteurs IA.

**Structure technique suggérée**

- **Routes** : `app/blog/page.tsx` (liste des articles) et `app/blog/[slug]/page.tsx` (article). Slug lisible et stable (ex. `top-10-livres-2024-communaute-bookmarkd`).
- **Contenu** : pour rester simple sans CMS, stocker les articles en **fichiers Markdown ou MDX** dans le repo (ex. `content/blog/`) avec frontmatter (title, description, date, image OG optionnelle). Utiliser une librairie type `gray-matter` + `remark`/`rehype` ou MDX pour le rendu. Alternative : contenu en JSON/TS si vous préférez tout en code.
- **SEO par article** : `generateMetadata` avec title, description, openGraph, canonical (`/blog/[slug]`), et **JSON-LD Article** (schema.org) avec `headline`, `datePublished`, `dateModified`, `author`, `image`. Chaque article = une URL canonique, une meta description unique, et des liens internes vers l’app (fiches livres, recherche, listes).

**Exemples de posts à créer (premiers contenus)**

1. **Top 10 livres 2024 par la communauté BookMarkd**
  Résumé des livres les plus notés / les plus lus en 2024 par les utilisateurs. Données réelles si possible (requête agrégée sur la base), sinon sélection éditoriale. Liens internes vers chaque fiche livre (`/books/[slug]`) et CTA vers la [recherche](https://bookmarkd.app/search) et l’inscription.
2. **Comment organiser sa PAL avec des listes**
  Guide pratique : définir des listes (à lire, en cours, coups de cœur), listes collaboratives, partage. Liens vers `/lists`, `/search`, et exemples de listes publiques si vous en mettez en avant.
3. **Pourquoi tenir un journal de lecture en 2025**
  Bénéfices (mémorisation, recommandations, communauté), comment BookMarkd aide (notes, avis, statistiques, fil social). Liens vers la home, l’inscription, et éventuellement une page “Fonctionnalités” ou “À propos”.

**Autres idées d’articles (suggestions)**

- **Les livres les plus recommandés par les utilisateurs BookMarkd** (données agrégées ou curation).
- **Comment découvrir des livres grâce à son réseau** (fil, profils, listes partagées).
- **PAL, DNF, relectures : le vocabulaire des lecteurs** (glossaire + liens vers les fonctionnalités).
- **Créer une liste collaborative pour un club de lecture** (use case listes + partage).

**Intégration au référencement**

- Inclure **/blog** et **/blog/[slug]** dans le **sitemap** (avec `lastModified` depuis le frontmatter).
- **Footer / navigation** : lien “Blog” visible (maillage interne depuis toutes les pages).
- **Page d’accueil** : bloc “Derniers articles” ou lien “Découvrir le blog” vers `/blog`.
- Chaque article contient des **liens contextuels** vers l’app (recherche, listes, fiches livre) pour faire circuler le “jus” SEO et inciter à l’inscription.
- Partager les articles sur les réseaux et dans les partenariats (guest posts en inverse : “retrouvez nos articles sur bookmarkd.app/blog”).

### Backlinks (liens externes) – actions hors code

- Le **blog** ci-dessus constitue le réservoir principal de contenu “linkable” ; chaque article peut être cité, partagé ou repris par d’autres sites (avec lien vers bookmarkd.app).
- **Guest posting** : publier sur des blogs lecture / lifestyle / tech en mentionnant BookMarkd (lien vers la home ou vers un article du blog).
- **Annuaires et agrégateurs** : inscription dans des annuaires thématiques (lecture, apps, produits français) et sur Product Hunt, AlternativeTo, Sens critique si pertinent.
- **Partenariats** : librairies, bookclubs, influenceurs lecture, newsletters : un lien depuis leur site ou leur bio vers bookmarkd.app ou vers un article ciblé.
- **Réseaux sociaux** : partage régulier des articles du blog et des liens vers des pages livres ou listes.
- **Prix / badges** : “Site du mois”, concours, partenariats médias : souvent un lien en retour.

À faire côté projet : définir 2–3 ancres principales (ex. “BookMarkd”, “suivi de lecture BookMarkd”) et des URLs cibles (home, /blog, /search, page “À propos”).

### Maillage interne (implémentable dans le code)

- **Liens depuis la home** : vers /search, /lists, /feed, et si vous ajoutez du contenu éditorial (ex. “Livres populaires”), liens vers des fiches livres.
- **Page livre** : liens clairs vers “Livres similaires” (déjà présents), vers le profil des lecteurs/reviewers (liens `/profiles/[username]`), et breadcrumb “Accueil > Livre > [Titre]” avec liens.
- **Profils publics** : liens vers les livres lus/listes, et depuis les fiches livre vers les profils des contributeurs.
- **Listes** : liens vers chaque livre de la liste (fiche livre) et vers le profil du créateur.
- **Footer global** : liens structurels (Accueil, Recherche, Listes, Connexion, CGU, À propos) pour que chaque page soit à 1–2 clics de la home.

Résultat : meilleure découverte des pages par les robots et renforcement des pages importantes (livres, search) via les ancres internes.

---

## Être affiché dans les moteurs IA (ChatGPT, Perplexity, etc.)

Les réponses des assistants IA (ChatGPT Search, Perplexity, Claude, etc.) s’appuient sur du contenu web indexé. Pour être cité et remonter dans ces réponses, il faut être crawlable et bien structuré.

### 1. Autoriser les crawlers IA dans robots.txt

- **OAI-SearchBot** (OpenAI) : c’est le crawler utilisé pour **ChatGPT Search** (réponses avec citations). Pour apparaître comme source citée dans ChatGPT, il ne faut **pas** bloquer OAI-SearchBot. Dans `robots.ts`, ne pas ajouter de `Disallow` pour ce user-agent (ou ajouter une règle explicite `Allow: /` pour OAI-SearchBot).
- **GPTBot** (OpenAI) : utilisé pour l’entraînement des modèles. Si vous voulez aussi être utilisé pour le training, laisser crawler ; sinon vous pouvez le bloquer sans impacter ChatGPT Search (les deux sont indépendants).
- **Recommandation** : dans `robots.ts`, prévoir des règles par user-agent : pour `Googlebot`, `Bingbot`, `OAI-SearchBot` (et éventuellement `GPTBot` si vous souhaitez être dans le training), autoriser les zones utiles (/, /books/, etc.) et Disallow uniquement /api/, /profiles/me, etc. Ne pas bloquer OAI-SearchBot sur les pages que vous voulez voir citées.
- **Autres** : Claude (Anthropic) et d’autres publient parfois un user-agent ; vous pouvez les autoriser de la même façon si vous visez une visibilité large. Perplexity s’appuie sur plusieurs sources ; en laissant le site ouvert aux crawlers “classiques” et à OAI-SearchBot, vous maximisez les chances d’être utilisé par les moteurs IA.

### 2. Contenu et structure “IA-friendly”

- **Données structurées (JSON-LD)** : déjà prévues (Book, WebSite, Organization). Les moteurs IA s’appuient sur du contenu sémantique clair ; le JSON-LD les aide à comprendre et citer correctement (titre, auteur, note, résumé).
- **Contenu texte** : résumés de livres, descriptions de listes, textes de présentation (home, À propos). Éviter les pages 100 % visuelles sans texte pour les pages que vous voulez voir citer.
- **URLs et titres clairs** : slugs livres “titre-par-auteur”, titres de page explicites ; ça améliore la qualité des citations dans les réponses IA.

### 3. Soumissions et indexation

- **Pas de “soumission directe” à ChatGPT** : la visibilité dans ChatGPT Search passe par l’indexation web (OpenAI crawl le web). En autorisant OAI-SearchBot et en ayant un sitemap à jour, vous favorisez la découverte.
- **Bing** : Bing alimente en partie les résultats de ChatGPT. Soumettre le sitemap dans Bing Webmaster Tools et vérifier que le site est bien indexé.
- **Google** : Google Search Console (soumission sitemap, vérification indexation) reste essentiel pour Google et pour la réutilisation de données par certains écosystèmes.
- **Délais** : les changements robots.txt peuvent prendre ~24 h côté OpenAI ; l’apparition comme source citée dépend du crawl et des requêtes des utilisateurs.

En résumé : **robots.ts** qui n’bloque pas (voire autorise explicitement) **OAI-SearchBot** sur les pages à citer, **sitemap** à jour, **JSON-LD** et contenu lisible, puis **Bing + Google** configurés. Pas d’action technique supplémentaire obligatoire pour “s’inscrire” chez ChatGPT ; la visibilité vient de l’indexation et de la qualité du contenu.

---

## Suggestions complémentaires pour un référencement maximal

- **Page À propos (/about ou /a-propos)** : présentation du projet, équipe ou vision, “Pourquoi BookMarkd”, lien vers l’inscription et le blog. Page idéale pour ancres “BookMarkd” et “suivi de lecture” dans les backlinks, et pour le schéma Organization (siège, nom, description).
- **Page Fonctionnalités ou Pour les librairies (/features ou /pour-les-librairies)** : résumé des fonctionnalités (listes, partage, recommandations, statistiques) ou page dédiée partenaires. Contenu texte riche pour requêtes “app suivi lecture”, “outil liste de livres”, favorise les citations par les moteurs IA.
- **FAQ (page dédiée ou section sur la home / about)** : questions fréquentes (C’est quoi BookMarkd ?, Comment créer une liste ?, Les données sont-elles privées ?). Ajouter un **schéma JSON-LD FAQPage** (schema.org) pour éligibilité aux extraits FAQ dans Google (rich results).
- **Page CGU / Politique de confidentialité** : déjà évoquée dans le footer ; s’assurer qu’elles existent et sont accessibles (liens en footer). Bon pour la confiance et pour les annuaires qui demandent une page légale.
- **Breadcrumbs systématiques** : en plus de la page livre, les utiliser sur blog, profils, listes (Accueil > Blog > [Titre] ; Accueil > Profil > [Username]). Possible d’ajouter le **schéma BreadcrumbList** (JSON-LD) pour les breadcrumbs dans les résultats Google.
- **Blog** : voir la section “Blog éditorial” ci-dessus ; inclure /blog et /blog/[slug] dans le sitemap et dans la navigation.
- **Cohérence des ancres** : dans les textes du site (blog, À propos, home), varier légèrement les ancres internes (“découvrir les listes”, “rechercher un livre”, “créer un compte”) tout en gardant des liens vers les mêmes URLs pour un maillage naturel.

