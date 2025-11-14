# Configuration Prisma

Prisma a été configuré pour synchroniser avec votre base de données Supabase.

## Configuration requise

Ajoutez la variable d'environnement `BOOK_MARKD_POSTGRES_URL_NON_POOLING` dans votre fichier `.env.local` :

**Option 1 : Session Pooler (recommandé pour Prisma)**

```bash
BOOK_MARKD_POSTGRES_URL_NON_POOLING="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Option 2 : Connexion directe**

```bash
BOOK_MARKD_POSTGRES_URL_NON_POOLING="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

Pour Supabase, vous pouvez obtenir ces URLs depuis :

- **Session Pooler** : Dashboard Supabase → Settings → Database → Connection string → **Session mode** (port 6543)
- **Connexion directe** : Dashboard Supabase → Settings → Database → Connection string → **Direct connection** (port 5432)

**⚠️ Important** :

- ❌ **NE PAS utiliser** le Connection Pooler (port 5432 avec pooler.supabase.com) - il n'est pas compatible avec Prisma
- ✅ **Utiliser** le Session Pooler (port 6543) ou la connexion directe (port 5432 sans pooler)

## Commandes Prisma

```bash
# Générer le client Prisma
pnpm prisma:generate

# Synchroniser le schéma avec la base de données (développement)
pnpm prisma:push

# Ouvrir Prisma Studio (interface graphique)
pnpm prisma:studio
```

## Synchronisation du schéma

Le schéma Prisma (`prisma/schema.prisma`) est synchronisé avec le schéma SQL Supabase (`supabase/schema.sql`).

**Important** : Si vous modifiez le schéma SQL dans Supabase, vous devez :

1. Mettre à jour `prisma/schema.prisma` en conséquence
2. Exécuter `pnpm prisma:generate` pour régénérer le client
3. Optionnellement, exécuter `pnpm prisma:push` pour synchroniser (attention : cela peut modifier votre base de données)

## Utilisation dans le code

Le client Prisma est disponible via :

```typescript
import { prisma } from "@/lib/prisma/client";

// Exemple d'utilisation
const userBook = await prisma.userBook.upsert({
  where: { userId_bookId: { userId, bookId } },
  update: { rating: 4.5 },
  create: { userId, bookId, status: "to_read", rating: 4.5 },
});
```

## Migration de Supabase vers Prisma

La fonction `rateBook` a été migrée pour utiliser Prisma au lieu de Supabase directement, ce qui garantit une meilleure gestion des upserts et de la synchronisation des données.
