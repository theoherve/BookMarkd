import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReadingStatusForm from "@/components/books/reading-status-form";
import RatingForm from "@/components/books/rating-form";
import ReviewForm from "@/components/books/review-form";
import ReviewsList, {
  BookReview,
} from "@/components/books/reviews-list";
import BookReadersList from "@/components/books/book-readers-list";
import { getBookReaders } from "@/features/books/server/get-book-readers";
import { getCurrentSession } from "@/lib/auth/session";
import { formatRating } from "@/lib/utils";
import { generateBookSlug, extractBookIdFromSlug } from "@/lib/slug";

type BookPageProps = {
  params: Promise<{
    slug: string;
  }>;
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
    review_likes: Array<{
      user: Array<{
        id: string;
        display_name: string;
        avatar_url: string | null;
      }> | null;
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
      likes: review.review_likes?.map((like) => ({
        id: like.user?.[0]?.id ?? "unknown",
        displayName: like.user?.[0]?.display_name ?? "Lectrice",
        avatarUrl: like.user?.[0]?.avatar_url ?? null,
      })) ?? [],
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
  slug: string,
  viewerId?: string | null,
): Promise<{
  book: RawBook | null;
  viewer: ViewerInfo;
}> => {
  // S'assurer que slug est valide
  if (!slug || typeof slug !== "string") {
    return {
      book: null,
      viewer: {
        status: null,
        rating: null,
      },
    };
  }

  // S'assurer que viewerId est soit une string valide, soit null, jamais undefined
  const validViewerId = viewerId && typeof viewerId === "string" ? viewerId : null;
  
  // Vérifier si c'est un UUID (rétrocompatibilité avec les anciennes URLs)
  const bookId = extractBookIdFromSlug(slug);
  
  try {
    let targetBookId: string | null = null;

    if (bookId) {
      // Recherche par ID (rétrocompatibilité)
      targetBookId = bookId;
    } else {
      // Recherche par slug (titre + auteur)
      const allBooks = await prisma.book.findMany({
        select: {
          id: true,
          title: true,
          author: true,
        },
        take: 10000,
      });

      if (!allBooks || allBooks.length === 0) {
        return {
          book: null,
          viewer: {
            status: null,
            rating: null,
          },
        };
      }

      // Trouver le livre dont le slug correspond
      const matchingBook = allBooks.find((book: { id: string; title: string; author: string }) => {
        const bookSlug = generateBookSlug(book.title, book.author);
        return bookSlug === slug;
      });

      if (!matchingBook) {
        return {
          book: null,
          viewer: {
            status: null,
            rating: null,
          },
        };
      }

      targetBookId = matchingBook.id;
    }

    if (!targetBookId) {
      return {
        book: null,
        viewer: {
          status: null,
          rating: null,
        },
      };
    }

    // Récupérer le livre avec toutes ses relations
    const book = await prisma.book.findUnique({
      where: { id: targetBookId },
      include: {
        bookTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            likes: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!book) {
      return {
        book: null,
        viewer: {
          status: null,
          rating: null,
        },
      };
    }

    // Récupérer les informations du viewer (user_books)
    let userBook = null;
    if (validViewerId) {
      userBook = await prisma.userBook.findUnique({
        where: {
          userId_bookId: {
            userId: validViewerId,
            bookId: targetBookId,
          },
        },
        select: {
          status: true,
          rating: true,
        },
      });
    }

    // Transformer les données Prisma en format RawBook
    const rawBook: RawBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover_url: book.coverUrl,
      summary: book.summary,
      average_rating: book.averageRating ? Number(book.averageRating) : null,
      ratings_count: book.ratingsCount,
      publication_year: book.publicationYear,
      book_tags: book.bookTags.map((bt: { tag: { id: string; name: string; slug: string } }) => ({
        tag: {
          id: bt.tag.id,
          name: bt.tag.name,
          slug: bt.tag.slug,
        },
      })),
      reviews: book.reviews.map((review: {
        id: string;
        title: string | null;
        content: string;
        createdAt: Date;
        visibility: string;
        spoiler: boolean;
        user: { id: string; displayName: string; avatarUrl: string | null };
        likes: Array<{
          user: { id: string; displayName: string; avatarUrl: string | null };
        }>;
        comments: Array<{
          id: string;
          content: string;
          createdAt: Date;
          user: { id: string; displayName: string; avatarUrl: string | null };
        }>;
      }) => ({
        id: review.id,
        title: review.title,
        content: review.content,
        created_at: review.createdAt.toISOString(),
        visibility: review.visibility as "public" | "friends" | "private",
        spoiler: review.spoiler,
        user: [
          {
            id: review.user.id,
            display_name: review.user.displayName,
            avatar_url: review.user.avatarUrl,
          },
        ],
        review_likes: review.likes.map((like: {
          user: { id: string; displayName: string; avatarUrl: string | null };
        }) => ({
          user: [
            {
              id: like.user.id,
              display_name: like.user.displayName,
              avatar_url: like.user.avatarUrl,
            },
          ],
        })),
        review_comments: review.comments.map((comment: {
          id: string;
          content: string;
          createdAt: Date;
          user: { id: string; displayName: string; avatarUrl: string | null };
        }) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.createdAt.toISOString(),
          user: [
            {
              id: comment.user.id,
              display_name: comment.user.displayName,
              avatar_url: comment.user.avatarUrl,
            },
          ],
        })),
      })),
    };

    return {
      book: rawBook,
      viewer: {
        status: userBook?.status as "to_read" | "reading" | "finished" | null,
        rating: userBook?.rating ? Number(userBook.rating) : null,
      },
    };
  } catch {
    return {
      book: null,
      viewer: {
        status: null,
        rating: null,
      },
    };
  }
};

export const generateMetadata = async ({
  params,
}: BookPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const { book } = await getBookDetail(slug);
  if (!book) {
    return {};
  }

  return {
    title: `${book.title} – BookMarkd`,
    description: book.summary ?? `Découvrez ${book.title} de ${book.author}.`,
  };
};

const BookPage = async ({ params }: BookPageProps) => {
  const { slug } = await params;
  const session = await getCurrentSession();
  const viewerId = session?.user?.id ? String(session.user.id) : null;

  const { book, viewer } = await getBookDetail(slug, viewerId);

  if (!book) {
    notFound();
  }

  // Rediriger vers l'URL avec slug si on est arrivé via un UUID
  const bookId = extractBookIdFromSlug(slug);
  if (bookId && bookId === book.id) {
    const correctSlug = generateBookSlug(book.title, book.author);
    redirect(`/books/${correctSlug}`);
  }

  const tags =
    book.book_tags?.map((relation) => relation.tag).filter(Boolean) ?? [];
  const reviews = mapReviews(book.reviews, viewerId);
  const readers = await getBookReaders(book.id);

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-3">
            <h1 className="text-4xl font-semibold text-foreground">
              {book.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              Par {book.author}
              {book.publication_year ? ` · ${book.publication_year}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {typeof book.average_rating === "number" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="text-sm font-medium">
                      {formatRating(book.average_rating)} / 5
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {book.ratings_count ?? 0}{" "}
                      {(book.ratings_count ?? 0) === 1 ? "vote" : "votes"}
                    </p>
                  </TooltipContent>
                </Tooltip>
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
            <div className="flex flex-wrap gap-4 pt-2">
              <ReadingStatusForm
                bookId={book.id}
                currentStatus={viewer.status ?? undefined}
              />
              <RatingForm bookId={book.id} currentRating={viewer.rating ?? undefined} />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[200px] shrink-0 overflow-hidden border border-border/60 bg-muted shadow-sm lg:mx-0">
            <div>
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
          </div>
        </header>

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Résumé</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {book.summary ??
                "Pas encore de résumé sur BookMarkd. Ajoutez votre avis après lecture pour aider la communauté."}
            </p>
          </section>

          <section className="space-y-6">
            <BookReadersList readers={readers} />
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
