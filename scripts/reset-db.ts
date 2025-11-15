/**
 * Script pour réinitialiser la base de données (supprimer toutes les données)
 * Usage: pnpm tsx scripts/reset-db.ts
 */

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

const supabase = createSupabaseServiceClient();

async function resetDatabase() {
  console.log("🔄 Réinitialisation de la base de données...");

  try {
    // Supprimer toutes les données dans l'ordre pour respecter les contraintes FK
    // L'ordre est important : supprimer d'abord les tables avec des FK, puis les tables référencées

    console.log("  - Suppression des review_comments...");
    await supabase.from("review_comments").delete().neq("id", "");

    console.log("  - Suppression des review_likes...");
    await supabase.from("review_likes").delete().neq("review_id", "");

    console.log("  - Suppression des reviews...");
    await supabase.from("reviews").delete().neq("id", "");

    console.log("  - Suppression des recommendations...");
    await supabase.from("recommendations").delete().neq("id", "");

    console.log("  - Suppression des activities...");
    await supabase.from("activities").delete().neq("id", "");

    console.log("  - Suppression des list_items...");
    await supabase.from("list_items").delete().neq("id", "");

    console.log("  - Suppression des list_collaborators...");
    await supabase.from("list_collaborators").delete().neq("list_id", "");

    console.log("  - Suppression des lists...");
    await supabase.from("lists").delete().neq("id", "");

    console.log("  - Suppression des follows...");
    await supabase.from("follows").delete().neq("follower_id", "");

    console.log("  - Suppression des user_books...");
    await supabase.from("user_books").delete().neq("id", "");

    console.log("  - Suppression des book_tags...");
    await supabase.from("book_tags").delete().neq("book_id", "");

    console.log("  - Suppression des books...");
    await supabase.from("books").delete().neq("id", "");

    console.log("  - Suppression des tags...");
    await supabase.from("tags").delete().neq("id", "");

    console.log("  - Suppression des users...");
    await supabase.from("users").delete().neq("id", "");

    console.log("✅ Base de données réinitialisée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    throw error;
  }
}

resetDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

