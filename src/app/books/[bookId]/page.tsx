import { notFound } from "next/navigation";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { Badge } from "@/components/ui/badge";
import ReadingStatusForm from "@/components/books/reading-status-form";
import RatingForm from "@/components/books/rating-form";
import ReviewForm from "@/components/books/review-form";
import ReviewsList, {
  BookReview,
} from "@/components/books/reviews-list";
import { getCurrentSession } from "@/lib/auth/session";

type BookPageProps = {
  params: {
    bookId: string;
  };
};

export const dynamic = "force-dynamic";

type RawBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  summary: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  publication_year: number | null;
  book_tags: Array<{
    tag: { id: string; name: string; slug: string } | null;
  }> | null;
  reviews: Array<{
    id: string;
    title: string | null;
    content: string;
    created_at: string;
    visibility: "public" | "friends" | "private";
    spoiler: boolean;
    user: Array<{
      id: string;
      display_name: string;
      avatar_url: string | null;
    }> | null;
    review_comments: Array<{
      id: string;
      content: string;
      created_at: string;
      user: Array<{
        id: string;
        display_name: string;
        avatar_url: string | null;
      }> | null;
    }> | null;
  }> | null;
};

type ViewerInfo = {
  status?: "to_read" | "reading" | "finished" | null;
  rating?: number | null;
};

const mapReviews = (
  rawReviews: RawBook["reviews"],
  viewerId?: string | null,
): BookReview[] => {
  if (!rawReviews) {
    return [];
  }

  return rawReviews
    .filter((review) => {
      if (review.visibility === "public") {
        return true;
      }
      const authorId = review.user?.[0]?.id;
      return viewerId && authorId === viewerId;
    })
    .map((review) => ({
      id: review.id,
      title: review.title,
      content: review.content,
      createdAt: review.created_at,
      visibility: review.visibility,
      spoiler: review.spoiler,
      user: {
        id: review.user?.[0]?.id ?? "unknown",
        displayName: review.user?.[0]?.display_name ?? "Lectrice",
        avatarUrl: review.user?.[0]?.avatar_url ?? null,
      },
      comments:
        review.review_comments?.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          user: {
            id: comment.user?.[0]?.id ?? "unknown",
            displayName: comment.user?.[0]?.display_name ?? "Lectrice",
            avatarUrl: comment.user?.[0]?.avatar_url ?? null,
          },
        })) ?? [],
    }));
};

const getBookDetail = async (
  bookId: string,
  viewerId?: string | null,
): Promise<{
  book: RawBook | null;
  viewer: ViewerInfo;
}> => {
  const supabase = createSupabaseServiceClient();
  const [bookResponse, userBookResponse] = await Promise.all([
    supabase
      .from("books")
      .select(
        `
          id,
          title,
          author,
          cover_url,
          summary,
          average_rating,
          ratings_count,
          publication_year,
          book_tags:book_tags(tag:tags(id,name,slug)),
          reviews:reviews(
            id,
            title,
            content,
            visibility,
            spoiler,
            created_at,
            user:users(id, display_name, avatar_url),
            review_comments:review_comments(
              id,
              content,
              created_at,
              user:users(id, display_name, avatar_url)
            )
          )
        `,
      )
      .eq("id", bookId)
      .maybeSingle<RawBook>(),
    viewerId
      ? supabase
          .from("user_books")
          .select("status, rating")
          .eq("book_id", bookId)
          .eq("user_id", viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (bookResponse.error) {
    throw bookResponse.error;
  }

  return {
    book: bookResponse.data,
    viewer: {
      status: userBookResponse.data?.status ?? null,
      rating: userBookResponse.data?.rating ?? null,
    },
  };
};

export const generateMetadata = async ({
  params,
}: BookPageProps): Promise<Metadata> => {
  const { book } = await getBookDetail(params.bookId);
  if (!book) {
    return {};
  }

  return {
    title: `${book.title} – BookMarkd`,
    description: book.summary ?? `Découvrez ${book.title} de ${book.author}.`,
  };
};

const BookPage = async ({ params }: BookPageProps) => {
  const session = await getCurrentSession();
  const viewerId = session?.user?.id ?? null;

  const { book, viewer } = await getBookDetail(params.bookId, viewerId);

  if (!book) {
    notFound();
  }

  const tags =
    book.book_tags?.map((relation) => relation.tag).filter(Boolean) ?? [];
  const reviews = mapReviews(book.reviews, viewerId);

  return (
    <AppShell>
      <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
        <div className="space-y-6">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-border/60 bg-muted">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover_url}
                alt={`Couverture de ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Pas de couverture
              </div>
            )}
          </div>
          <ReadingStatusForm
            bookId={book.id}
            currentStatus={viewer.status ?? undefined}
          />
          <RatingForm bookId={book.id} currentRating={viewer.rating ?? undefined} />
        </div>

        <div className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Livre
            </p>
            <h1 className="text-4xl font-semibold text-foreground">
              {book.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              par {book.author}
              {book.publication_year ? ` · ${book.publication_year}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {typeof book.average_rating === "number" ? (
                <Badge className="text-sm font-medium">
                  {book.average_rating.toFixed(1)} / 5 (
                  {book.ratings_count ?? 0} votes)
                </Badge>
              ) : null}
              {tags.map(
                (tag) =>
                  tag && (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ),
              )}
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Résumé</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {book.summary ??
                "Pas encore de résumé sur BookMarkd. Ajoutez votre avis après lecture pour aider la communauté."}
            </p>
          </section>

          <section className="space-y-6">
            <ReviewForm bookId={book.id} />
            <ReviewsList bookId={book.id} reviews={reviews} viewerId={viewerId} />
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default BookPage;

