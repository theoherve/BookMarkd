import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// // Vérifier que la variable d'environnement est définie
// const databaseUrl = process.env.BOOK_MARKD_POSTGRES_URL_NON_POOLING;
// if (!databaseUrl) {
//   console.error(
//     "[Prisma] BOOK_MARKD_POSTGRES_URL_NON_POOLING is not set. Please check your .env.local file."
//   );
// } else {
//   // Vérifier le type de connexion
//   const isSessionPooler =
//     databaseUrl.includes("pooler.supabase.com") &&
//     databaseUrl.includes(":6543");
//   const isDirectConnection =
//     databaseUrl.includes("db.") || databaseUrl.includes(":5432");
//   const isConnectionPooler =
//     databaseUrl.includes("pooler.supabase.com") &&
//     databaseUrl.includes(":5432");

//   if (isConnectionPooler) {
//     console.error(
//       "[Prisma] ⚠️  WARNING: You're using Connection Pooler (port 5432) which doesn't work with Prisma.\n" +
//         "   You need to use Session Pooler (port 6543) instead.\n" +
//         "   Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true\n" +
//         "   Get it from: Supabase Dashboard → Settings → Database → Connection string → Session mode"
//     );
//   } else if (isSessionPooler) {
//     console.log(
//       "[Prisma] ✅ Using Session Pooler (port 6543) - compatible with Prisma"
//     );
//   } else if (isDirectConnection) {
//     console.log("[Prisma] ✅ Using Direct connection (port 5432)");
//   }
// }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
