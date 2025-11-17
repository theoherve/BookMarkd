/**
 * Script pour générer rétroactivement les activités depuis les données existantes
 * (reviews, ratings, status changes)
 * 
 * Usage: pnpm tsx scripts/generate-activities-from-existing-data.ts
 */

import db from "../src/lib/supabase/db";
import { createActivity } from "../src/lib/activities/create-activity";

const generateActivities = async () => {
  try {
    console.log("🔄 Génération des activités depuis les données existantes...\n");

    // 1. Générer les activités depuis les ratings (user_books avec rating)
    console.log("📊 Récupération des notes (ratings)...");
    const { data: ratings, error: ratingsError } = await db.client
      .from("user_books")
      .select(
        `
        user_id,
        book_id,
        rating,
        rated_at,
        book:book_id ( title )
      `,
      )
      .not("rating", "is", null)
      .not("rated_at", "is", null);

    if (ratingsError) {
      throw ratingsError;
    }

    console.log(`   Trouvé ${ratings?.length ?? 0} notes\n`);

    // Vérifier quelles activités de rating existent déjà
    const { data: existingRatingActivities } = await db.client
      .from("activities")
      .select("payload")
      .eq("type", "rating");

    const existingRatings = new Set<string>();
    (existingRatingActivities ?? []).forEach((activity) => {
      const payload = activity.payload as { book_id?: string; user_id?: string } | null;
      if (payload?.book_id && payload?.user_id) {
        existingRatings.add(`${payload.user_id}:${payload.book_id}`);
      }
    });

    let ratingsCreated = 0;
    for (const rating of ratings ?? []) {
      const userId = (rating as { user_id: string }).user_id;
      const bookId = (rating as { book_id: string }).book_id;
      const ratingValue = (rating as { rating: number }).rating;
      const book = Array.isArray((rating as { book: unknown }).book)
        ? (rating as { book: Array<{ title: string }> }).book[0]
        : null;

      const key = `${userId}:${bookId}`;
      if (existingRatings.has(key) || !book) {
        continue;
      }

      await createActivity(userId, "rating", {
        book_id: bookId,
        book_title: book.title,
        rating: ratingValue,
      });
      ratingsCreated++;
    }
    console.log(`   ✅ ${ratingsCreated} activités de notation créées\n`);

    // 2. Générer les activités depuis les reviews (uniquement public et friends)
    console.log("💬 Récupération des commentaires (reviews)...");
    const { data: reviews, error: reviewsError } = await db.client
      .from("reviews")
      .select(
        `
        id,
        user_id,
        book_id,
        content,
        visibility,
        created_at,
        book:book_id ( title )
      `,
      )
      .in("visibility", ["public", "friends"]);

    if (reviewsError) {
      throw reviewsError;
    }

    console.log(`   Trouvé ${reviews?.length ?? 0} commentaires (public/friends)\n`);

    // Vérifier quelles activités de review existent déjà
    const { data: existingReviewActivities } = await db.client
      .from("activities")
      .select("payload")
      .eq("type", "review");

    const existingReviews = new Set<string>();
    (existingReviewActivities ?? []).forEach((activity) => {
      const payload = activity.payload as { book_id?: string; user_id?: string } | null;
      if (payload?.book_id && payload?.user_id) {
        existingReviews.add(`${payload.user_id}:${payload.book_id}`);
      }
    });

    let reviewsCreated = 0;
    for (const review of reviews ?? []) {
      const userId = (review as { user_id: string }).user_id;
      const bookId = (review as { book_id: string }).book_id;
      const content = (review as { content: string }).content;
      const visibility = (review as { visibility: string }).visibility;
      const book = Array.isArray((review as { book: unknown }).book)
        ? (review as { book: Array<{ title: string }> }).book[0]
        : null;

      const key = `${userId}:${bookId}`;
      if (existingReviews.has(key) || !book) {
        continue;
      }

      const reviewSnippet = content.length > 150 
        ? `${content.substring(0, 150)}...` 
        : content;

      await createActivity(userId, "review", {
        book_id: bookId,
        book_title: book.title,
        review_snippet: reviewSnippet,
        note: reviewSnippet,
        visibility,
      });
      reviewsCreated++;
    }
    console.log(`   ✅ ${reviewsCreated} activités de commentaire créées\n`);

    // 3. Générer les activités depuis les changements de statut
    console.log("📖 Récupération des changements de statut...");
    const { data: statusChanges, error: statusError } = await db.client
      .from("user_books")
      .select(
        `
        user_id,
        book_id,
        status,
        updated_at,
        created_at,
        rated_at,
        book:book_id ( title )
      `,
      );

    if (statusError) {
      throw statusError;
    }

    console.log(`   Trouvé ${statusChanges?.length ?? 0} entrées user_books\n`);

    const statusLabels: Record<string, string> = {
      to_read: "a ajouté à sa liste de lecture",
      reading: "a commencé à lire",
      finished: "a terminé",
    };

    let statusCreated = 0;
    for (const entry of statusChanges ?? []) {
      const userId = (entry as { user_id: string }).user_id;
      const bookId = (entry as { book_id: string }).book_id;
      const status = (entry as { status: string | null }).status;
      const updatedAt = new Date((entry as { updated_at: string }).updated_at).getTime();
      const createdAt = new Date((entry as { created_at: string }).created_at).getTime();
      const ratedAt = (entry as { rated_at: string | null }).rated_at
        ? new Date((entry as { rated_at: string }).rated_at).getTime()
        : null;

      const book = Array.isArray((entry as { book: unknown }).book)
        ? (entry as { book: Array<{ title: string }> }).book[0]
        : null;

      if (!book || !status) {
        continue;
      }

      // Ne créer une activité de statut que si updated_at est différent de created_at
      // et différent de rated_at (pour éviter les doublons)
      const isNewAddition = Math.abs(updatedAt - createdAt) < 1000;
      const isRatingUpdate = ratedAt && Math.abs(updatedAt - ratedAt) < 1000;

      if (isNewAddition || isRatingUpdate) {
        continue;
      }

      const statusNote = statusLabels[status] || "a mis à jour son statut";

      await createActivity(userId, "status_change", {
        book_id: bookId,
        book_title: book.title,
        status_note: statusNote,
      });
      statusCreated++;
    }
    console.log(`   ✅ ${statusCreated} activités de changement de statut créées\n`);

    console.log("✨ Génération terminée !");
    console.log(`   Total: ${ratingsCreated + reviewsCreated + statusCreated} activités créées`);
  } catch (error) {
    console.error("❌ Erreur lors de la génération des activités:", error);
    process.exit(1);
  }
};

generateActivities()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

