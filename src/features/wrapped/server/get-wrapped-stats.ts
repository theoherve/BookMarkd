import db from "@/lib/supabase/db";
import type {
  WrappedStats,
  WrappedBook,
  WrappedCategory,
  WrappedFeeling,
  WrappedMonthlyBreakdown,
} from "../types";

/**
 * Calcule les statistiques wrapped pour un utilisateur et une année donnée
 */
export const getWrappedStats = async (
  userId: string,
  year: number,
): Promise<WrappedStats | null> => {
  try {
    const yearStart = new Date(year, 0, 1).toISOString();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    // 1. Livres lus dans l'année
    const { data: finishedBooks, error: booksError } = await db.client
      .from("user_books")
      .select(
        `
        id,
        rating,
        rated_at,
        updated_at,
        book:book_id (
          id,
          title,
          author,
          cover_url
        )
      `,
      )
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("updated_at", yearStart)
      .lte("updated_at", yearEnd);

    if (booksError) {
      throw booksError;
    }

    const books = (finishedBooks ?? [])
      .map((row) =>
        db.toCamel<{
          id: string;
          rating: number | null;
          ratedAt: string | null;
          updatedAt: string;
          book?: {
            id: string;
            title: string;
            author: string;
            coverUrl: string | null;
          };
        }>(row),
      )
      .filter((b) => b.book);

    const totalBooksRead = books.length;

    if (totalBooksRead === 0) {
      return {
        year,
        totalBooksRead: 0,
        averageRating: 0,
        favoriteCategory: null,
        topBooks: [],
        worstBook: null,
        favoriteAuthor: null,
        mostProductiveMonth: null,
        topCategories: [],
        dominantFeelings: [],
        reviewsWritten: 0,
        listsCreated: 0,
        monthlyBreakdown: [],
      };
    }

    // 2. Note moyenne
    const ratings = books
      .map((b) => b.rating)
      .filter((r): r is number => r !== null && typeof r === "number");
    const averageRating =
      ratings.length > 0
        ? parseFloat(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2),
          )
        : 0;

    // 3. Top livres (par note)
    const booksWithRatings = books
      .filter((b) => b.rating !== null && b.book)
      .map((b) => ({
        id: b.book!.id,
        title: b.book!.title,
        author: b.book!.author,
        rating: b.rating!,
        coverUrl: b.book!.coverUrl,
        ratedAt: b.ratedAt || b.updatedAt,
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime();
      });

    const topBooks: WrappedBook[] = booksWithRatings.slice(0, 5).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      rating: b.rating,
      coverUrl: b.coverUrl,
    }));

    // 4. Livre le plus détesté (plus basse note)
    const worstBookData =
      booksWithRatings.length > 0
        ? booksWithRatings[booksWithRatings.length - 1]
        : null;
    const worstBook: WrappedBook | null = worstBookData
      ? {
          id: worstBookData.id,
          title: worstBookData.title,
          author: worstBookData.author,
          rating: worstBookData.rating,
          coverUrl: worstBookData.coverUrl,
        }
      : null;

    // 5. Catégories préférées
    const bookIds = books.map((b) => b.book!.id);
    let topCategories: WrappedCategory[] = [];
    let favoriteCategory: WrappedCategory | null = null;

    if (bookIds.length > 0) {
      const { data: tagsData, error: tagsError } = await db.client
        .from("book_tags")
        .select(
          `
          tag_id,
          tags:tag_id (
            name
          )
        `,
        )
        .in("book_id", bookIds);

      if (!tagsError && tagsData) {
        const categoryCounts = new Map<string, number>();
        tagsData.forEach((row) => {
          const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
          if (tag && typeof tag === "object" && "name" in tag) {
            const name = tag.name as string;
            categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
          }
        });

        topCategories = Array.from(categoryCounts.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: parseFloat(((count / totalBooksRead) * 100).toFixed(1)),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        favoriteCategory = topCategories[0] || null;
      }
    }

    // 6. Auteur préféré
    const authorCounts = new Map<string, number>();
    books.forEach((b) => {
      if (b.book) {
        const author = b.book.author;
        authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
      }
    });
    const favoriteAuthorEntry = Array.from(authorCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];
    const favoriteAuthor = favoriteAuthorEntry
      ? { name: favoriteAuthorEntry[0], count: favoriteAuthorEntry[1] }
      : null;

    // 7. Mois le plus productif
    const monthlyCounts = new Map<number, number>();
    books.forEach((b) => {
      const month = new Date(b.updatedAt).getMonth(); // 0-11
      monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
    });
    const monthlyBreakdown: WrappedMonthlyBreakdown[] = Array.from(
      { length: 12 },
      (_, i) => ({
        month: i + 1,
        count: monthlyCounts.get(i) ?? 0,
      }),
    );
    const mostProductiveMonthEntry = Array.from(monthlyCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];
    const mostProductiveMonth = mostProductiveMonthEntry
      ? { month: mostProductiveMonthEntry[0] + 1, count: mostProductiveMonthEntry[1] }
      : null;

    // 8. Sentiments dominants
    const { data: feelingsData, error: feelingsError } = await db.client
      .from("user_book_feelings")
      .select(
        `
        feeling_keywords:keyword_id (
          label
        )
      `,
      )
      .eq("user_id", userId)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd);

    const dominantFeelings: WrappedFeeling[] = [];
    if (!feelingsError && feelingsData) {
      const feelingCounts = new Map<string, number>();
      feelingsData.forEach((row) => {
        const keyword = Array.isArray(row.feeling_keywords)
          ? row.feeling_keywords[0]
          : row.feeling_keywords;
        if (
          keyword &&
          typeof keyword === "object" &&
          "label" in keyword
        ) {
          const label = keyword.label as string;
          feelingCounts.set(label, (feelingCounts.get(label) ?? 0) + 1);
        }
      });

      dominantFeelings.push(
        ...Array.from(feelingCounts.entries())
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );
    }

    // 9. Reviews écrites
    const { data: reviewsData, error: reviewsError } = await db.client
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd);
    const reviewsWritten = reviewsError ? 0 : (reviewsData?.count ?? 0);

    // 10. Listes créées
    const { data: listsData, error: listsError } = await db.client
      .from("lists")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd);
    const listsCreated = listsError ? 0 : (listsData?.count ?? 0);

    return {
      year,
      totalBooksRead,
      averageRating,
      favoriteCategory,
      topBooks,
      worstBook,
      favoriteAuthor,
      mostProductiveMonth,
      topCategories,
      dominantFeelings,
      reviewsWritten,
      listsCreated,
      monthlyBreakdown,
    };
  } catch (error) {
    console.error("[wrapped] Error getting wrapped stats:", error);
    return null;
  }
};
