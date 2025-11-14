# Configuration Prisma

Prisma a été configuré pour synchroniser avec votre base de données Supabase.

## Configuration requise

Ajoutez la variable d'environnement `DATABASE_URL` dans votre fichier `.env.local` :

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

Pour Supabase, vous pouvez obtenir cette URL depuis :
- Dashboard Supabase → Settings → Database → Connection string → URI

**Note importante** : Pour les Server Actions et les opérations de longue durée, utilisez la connection string directe (sans `pgbouncer`). Pour les connexions client, utilisez la version avec `pgbouncer`.

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

