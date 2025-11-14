/**
 * Script pour réinitialiser la base de données (supprimer toutes les données)
 * Usage: pnpm tsx scripts/reset-db.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Réinitialisation de la base de données...");

  try {
    // Supprimer toutes les données dans l'ordre pour respecter les contraintes FK
    // L'ordre est important : supprimer d'abord les tables avec des FK, puis les tables référencées

    console.log("  - Suppression des review_comments...");
    await prisma.reviewComment.deleteMany();

    console.log("  - Suppression des review_likes...");
    await prisma.reviewLike.deleteMany();

    console.log("  - Suppression des reviews...");
    await prisma.review.deleteMany();

    console.log("  - Suppression des recommendations...");
    await prisma.recommendation.deleteMany();

    console.log("  - Suppression des activities...");
    await prisma.activity.deleteMany();

    console.log("  - Suppression des list_items...");
    await prisma.listItem.deleteMany();

    console.log("  - Suppression des list_collaborators...");
    await prisma.listCollaborator.deleteMany();

    console.log("  - Suppression des lists...");
    await prisma.list.deleteMany();

    console.log("  - Suppression des follows...");
    await prisma.follow.deleteMany();

    console.log("  - Suppression des user_books...");
    await prisma.userBook.deleteMany();

    console.log("  - Suppression des book_tags...");
    await prisma.bookTag.deleteMany();

    console.log("  - Suppression des books...");
    await prisma.book.deleteMany();

    console.log("  - Suppression des tags...");
    await prisma.tag.deleteMany();

    console.log("  - Suppression des users...");
    await prisma.user.deleteMany();

    console.log("✅ Base de données réinitialisée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

