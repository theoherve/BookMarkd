import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import BackButton from "@/components/layout/back-button";
import db from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReadingStatusForm from "@/components/books/reading-status-form";
import RatingForm from "@/components/books/rating-form";
import AddToListButton from "@/components/books/add-to-list-button";
import SuggestBookToFriendButton from "@/components/profile/suggest-book-to-friend-button";
import ReviewForm from "@/components/books/review-form";
import ReviewsList, {
  BookReview,
} from "@/components/books/reviews-list";
import BookReadersList from "@/components/books/book-readers-list";
import BookFeelingsSection from "@/components/books/book-feelings-section";
import SimilarBooksSection from "@/components/books/similar-books-section";
import { getBookReaders } from "@/features/books/server/get-book-readers";
import { getSimilarBooks } from "@/features/books/server/get-similar-books";
import {
  getAllFeelingKeywords,
  getBookFeelings,
  getViewerFeelings,
} from "@/features/books/server/get-book-feelings";
import { getFollowing } from "@/server/actions/follow";
import { getCurrentSession } from "@/lib/auth/session";
import { formatRating } from "@/lib/utils";
import { generateBookSlug, extractBookIdFromSlug } from "@/lib/slug";
import { getBookCoverUrl } from "@/lib/storage/covers";

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
  viewerFollowingIds?: Set<string>,
): BookReview[] => {
  if (!rawReviews) {
    return [];
  }

  return rawReviews
    .filter((review) => {
      if (review.visibility === "public") {
        return true;
      }
      const authorId = review.user?.[0]?.id ?? null;
      if (!viewerId || !authorId) {
        return false;
      }
      if (authorId === viewerId) {
        return true;
      }
      if (review.visibility === "friends") {
        return !!viewerFollowingIds?.has(authorId);
      }
      return false; // private
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
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
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

  try {
    let targetBookId: string | null = null;

    // Vérifier si c'est un UUID (rétrocompatibilité avec les anciennes URLs)
    const bookId = extractBookIdFromSlug(slug);
    
    if (bookId) {
      // Recherche par ID (rétrocompatibilité)
      targetBookId = bookId;
    } else {
      // Recherche par slug (titre + auteur)
      const { data: allBooks, error: booksError } = await db.client
        .from("books")
        .select("id, title, author")
        .limit(10000);
      
      if (booksError) {
        throw booksError;
      }

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
    const { data: bookRow, error: bookError } = await db.client
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
        book_tags:book_tags ( tag:tags ( id, name, slug ) ),
        reviews:reviews (
          id,
          title,
          content,
          created_at,
          visibility,
          spoiler,
          user:user_id ( id, display_name, avatar_url ),
          review_likes:review_likes ( user:user_id ( id, display_name, avatar_url ) ),
          review_comments:review_comments (
            id,
            content,
            created_at,
            user:user_id ( id, display_name, avatar_url )
          )
        )
      `,
      )
      .eq("id", targetBookId)
      .maybeSingle();
    
    if (bookError) {
      throw bookError;
    }

    if (!bookRow) {
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
      const { data: userBookRow } = await db.client
        .from("user_books")
        .select("status, rating")
        .eq("user_id", validViewerId)
        .eq("book_id", targetBookId)
        .maybeSingle();
      userBook = userBookRow ?? null;
    }

    // Transformer les données Supabase en format RawBook
    const book = bookRow!;
    
    // Résoudre l'URL de la cover avec priorité Supabase Storage
    const resolvedCoverUrl = await getBookCoverUrl(book.id, book.cover_url);
    
    const rawBook: RawBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover_url: resolvedCoverUrl,
      summary: book.summary,
      average_rating:
        typeof book.average_rating === "number" ? book.average_rating : null,
      ratings_count: book.ratings_count ?? 0,
      publication_year: book.publication_year,
      book_tags: (book.book_tags ?? []).map((bt: {
        tag?: { id?: string; name?: string; slug?: string } | Array<{ id?: string; name?: string; slug?: string }>;
      }) => {
        const tag = Array.isArray(bt.tag) ? bt.tag[0] : bt.tag;
        return {
          tag: {
            id: tag?.id ?? "",
            name: tag?.name ?? "",
            slug: tag?.slug ?? "",
          },
        };
      }),
      reviews:
        (book.reviews ?? []).map((review: {
          id: string;
          title: string | null;
          content: string;
          created_at: string;
          visibility: "public" | "friends" | "private";
          spoiler: boolean;
          user?: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null;
          review_likes?: Array<{ user?: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null }> | null;
          review_comments?: Array<{
            id: string;
            content: string;
            created_at: string;
            user?: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null;
          }> | null;
        }) => {
          // Normaliser user : peut être un tableau, un objet unique, null ou undefined
          const normalizeUser = (
            user: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null | undefined
          ) => {
            if (!user) return [];
            if (Array.isArray(user)) {
              return user.map((u: { id: string; display_name: string; avatar_url: string | null }) => ({
                id: u.id,
                display_name: u.display_name,
                avatar_url: u.avatar_url,
              }));
            }
            // C'est un objet unique
            return [{
              id: user.id,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
            }];
          };

          return {
            id: review.id,
            title: review.title,
            content: review.content,
            created_at: review.created_at,
            visibility: review.visibility,
            spoiler: review.spoiler,
            user: normalizeUser(review.user),
            review_likes: review.review_likes
              ? review.review_likes.map((like: {
                  user?: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null;
                }) => ({
                  user: normalizeUser(like.user),
                }))
              : [],
            review_comments: review.review_comments
              ? review.review_comments.map((comment: {
                  id: string;
                  content: string;
                  created_at: string;
                  user?: Array<{ id: string; display_name: string; avatar_url: string | null }> | { id: string; display_name: string; avatar_url: string | null } | null;
                }) => ({
                  id: comment.id,
                  content: comment.content,
                  created_at: comment.created_at,
                  user: normalizeUser(comment.user),
                }))
              : [],
          };
        }) ?? [],
    };

    return {
      book: rawBook,
      viewer: {
        status: (userBook?.status as "to_read" | "reading" | "finished") ?? null,
        rating: typeof userBook?.rating === "number" ? userBook.rating : null,
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
  
  // Préparer l'ensemble des auteurs (reviews + feelings) pour vérifier les relations de suivi
  let viewerFollowingIds: Set<string> | undefined = undefined;
  if (viewerId) {
    const authorIds = new Set<string>();
    
    // Ajouter les auteurs des reviews
    if (Array.isArray(book.reviews) && book.reviews.length > 0) {
      book.reviews.forEach((r) => {
        const id = r.user?.[0]?.id;
        if (id) authorIds.add(id);
      });
    }
    
    // Récupérer les feelings pour obtenir aussi leurs auteurs
    const allFeelingsTemp = await getBookFeelings(book.id, viewerId, undefined);
    allFeelingsTemp.forEach((f) => {
      authorIds.add(f.userId);
    });
    
    if (authorIds.size > 0) {
      const { data: followsRows } = await db.client
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .in("following_id", Array.from(authorIds));
      const ids =
        (followsRows ?? []).map(
          (row: { following_id: string }) => row.following_id,
        ) ?? [];
      viewerFollowingIds = new Set(ids);
    }
  }
  
  const reviews = mapReviews(book.reviews, viewerId, viewerFollowingIds);
  const [readers, similarBooks] = await Promise.all([
    getBookReaders(book.id),
    getSimilarBooks(book.id, 6),
  ]);

  // Récupérer les feelings avec les followingIds corrects
  const [availableKeywords, allFeelings, viewerFeelingsData, followingForRecommend] = await Promise.all([
    getAllFeelingKeywords(),
    getBookFeelings(book.id, viewerId, viewerFollowingIds),
    viewerId ? getViewerFeelings(book.id, viewerId) : Promise.resolve({ keywordIds: [], visibility: "public" as const }),
    viewerId ? getFollowing(viewerId) : Promise.resolve([]),
  ]);

  const viewerFeelings = viewerFeelingsData.keywordIds;
  const viewerFeelingsVisibility = viewerFeelingsData.visibility;

  return (
    <AppShell>
      <div className="space-y-10">
        <BackButton ariaLabel="Retour à la page précédente" />
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
            <div className="flex w-fit flex-col gap-4 pt-2">
              <div className="flex flex-wrap gap-4">
                <ReadingStatusForm
                  bookId={book.id}
                  currentStatus={viewer.status ?? undefined}
                />
                <RatingForm bookId={book.id} currentRating={viewer.rating ?? undefined} />
              </div>
              {viewerId ? (
                <div className="flex w-full min-w-0 gap-2">
                  <AddToListButton bookId={book.id} className="min-w-0 flex-1" />
                  <SuggestBookToFriendButton
                    book={{ id: book.id, title: book.title, author: book.author }}
                    followingList={followingForRecommend}
                    showLabel
                    className="min-w-0 flex-1"
                  />
                </div>
              ) : null}
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
            <BookFeelingsSection
              bookId={book.id}
              availableKeywords={availableKeywords}
              viewerFeelings={viewerFeelings}
              viewerFeelingsVisibility={viewerFeelingsVisibility}
              allFeelings={allFeelings}
              viewerId={viewerId}
            />
          </section>

          <section className="space-y-6">
            <ReviewForm bookId={book.id} />
            <ReviewsList bookId={book.id} reviews={reviews} viewerId={viewerId} />
          </section>

          {similarBooks.length > 0 ? (
            <section className="space-y-6">
              <SimilarBooksSection books={similarBooks} />
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
};

export default BookPage;

