"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Search, X, Filter, ScanBarcode, FileText, User, BookOpen, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBookSearch } from "@/features/search/api/use-book-search";
import { useUserSearch } from "@/features/search/api/use-user-search";
import { useBlogSearch } from "@/features/search/api/use-blog-search";
import { useSearchSuggestions } from "@/features/search/api/use-search-suggestions";
import { useTagsQuery } from "@/features/search/api/use-tags-query";
import SearchResultCard from "@/components/search/search-result-card";
import UserResultCard from "@/components/search/user-result-card";
import { BookLoader } from "@/components/ui/book-loader";
import ScanFlow from "@/components/scan/scan-flow";
import { generateBookSlug } from "@/lib/slug";
import type { BlogSuggestion, SearchBook, SearchUser } from "@/features/search/types";

type SuggestionItem =
  | { type: "book"; data: SearchBook }
  | { type: "user"; data: SearchUser }
  | { type: "blog"; data: BlogSuggestion }
  | { type: "all" };

const SearchClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");
  const initialQuery = useMemo(
    () => (urlQuery ? decodeURIComponent(urlQuery) : ""),
    [urlQuery],
  );
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const lastProcessedQueryRef = useRef<string | null>(urlQuery);

  useEffect(() => {
    const currentUrlQuery = searchParams.get("q");
    if (currentUrlQuery !== lastProcessedQueryRef.current) {
      lastProcessedQueryRef.current = currentUrlQuery;
      queueMicrotask(() => {
        if (currentUrlQuery) {
          const decodedQuery = decodeURIComponent(currentUrlQuery);
          setQuery(decodedQuery);
          setSubmittedQuery(decodedQuery);
        } else {
          setQuery("");
          setSubmittedQuery("");
        }
      });
    }
  }, [searchParams]);

  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [readingStatus, setReadingStatus] = useState<
    "to_read" | "reading" | "finished" | undefined
  >();
  const [author, setAuthor] = useState<string>("");
  const [includeExternal, setIncludeExternal] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isScanActive, setIsScanActive] = useState(false);

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const suggestContainerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isFetching: isFetchingSuggestions } =
    useSearchSuggestions(query);

  const hasSuggestionResults =
    (suggestions?.books.length ?? 0) > 0 ||
    (suggestions?.users.length ?? 0) > 0 ||
    (suggestions?.blog.length ?? 0) > 0;

  const shouldShowSuggestDropdown =
    isSuggestOpen && query.trim().length >= 2;

  const flatSuggestItems: SuggestionItem[] = useMemo(
    () => [
      ...(suggestions?.books.map((b) => ({ type: "book" as const, data: b })) ?? []),
      ...(suggestions?.users.map((u) => ({ type: "user" as const, data: u })) ?? []),
      ...(suggestions?.blog.map((b) => ({ type: "blog" as const, data: b })) ?? []),
      ...(hasSuggestionResults || isFetchingSuggestions
        ? [{ type: "all" as const }]
        : []),
    ],
    [suggestions, hasSuggestionResults, isFetchingSuggestions],
  );

  const navigateToSuggestion = (item: SuggestionItem) => {
    setIsSuggestOpen(false);
    setFocusedIndex(-1);
    if (item.type === "book") {
      router.push(`/books/${generateBookSlug(item.data.title, item.data.author)}`);
    } else if (item.type === "user") {
      router.push(`/profiles/${item.data.username ?? item.data.id}`);
    } else if (item.type === "blog") {
      router.push(`/blog/${item.data.slug}`);
    } else {
      const trimmed = query.trim();
      setSubmittedQuery(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSuggestDropdown) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, flatSuggestItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === "Enter" && focusedIndex >= 0) {
      event.preventDefault();
      const item = flatSuggestItems[focusedIndex];
      if (item) navigateToSuggestion(item);
    } else if (event.key === "Escape") {
      setIsSuggestOpen(false);
      setFocusedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestContainerRef.current &&
        !suggestContainerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [suggestions]);

  const { data: tagsData } = useTagsQuery();

  const hasSearchQuery = Boolean(
    submittedQuery || selectedGenre || minRating || readingStatus || author,
  );

  const {
    data: booksData,
    isLoading: isLoadingBooks,
    isFetching: isFetchingBooks,
    isError: isErrorBooks,
    refetch: refetchBooks,
  } = useBookSearch(
    {
      q: submittedQuery,
      genre: selectedGenre,
      minRating,
      readingStatus,
      author: author.trim() || undefined,
      includeExternal,
    },
    hasSearchQuery,
  );

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useUserSearch({ q: submittedQuery }, Boolean(submittedQuery));

  const {
    data: blogData,
    isLoading: isLoadingBlog,
    isFetching: isFetchingBlog,
    isError: isErrorBlog,
    refetch: refetchBlog,
  } = useBlogSearch(submittedQuery, Boolean(submittedQuery));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setIsSuggestOpen(false);
    setFocusedIndex(-1);
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
    setIsSuggestOpen(false);
    setFocusedIndex(-1);
    router.push("/search", { scroll: false });
  };

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (selectedGenre) {
      const tag = tagsData?.tags.find((item) => item.slug === selectedGenre);
      filters.push(tag?.name ?? selectedGenre);
    }
    if (minRating && minRating > 0) {
      filters.push(`Note min: ${minRating}/5`);
    }
    if (readingStatus) {
      const statusLabels = {
        to_read: "À lire",
        reading: "En cours",
        finished: "Terminé",
      };
      filters.push(`État: ${statusLabels[readingStatus]}`);
    }
    if (author) {
      filters.push(`Auteur: ${author}`);
    }
    if (!includeExternal) {
      filters.push("Catalogue BookMarkd uniquement");
    }
    return filters;
  }, [selectedGenre, minRating, readingStatus, author, includeExternal, tagsData?.tags]);

  const isLoading =
    (isLoadingBooks || isFetchingBooks) ||
    (isLoadingUsers || isFetchingUsers) ||
    (isLoadingBlog || isFetchingBlog);

  return (
    <div className="space-y-8">
      {/* Barre de recherche */}
      <div ref={suggestContainerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur mb-1"
      >
        {showFilters ? (
          <div className="mb-4 flex w-full flex-wrap items-center gap-4 rounded-xl bg-card/70 p-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label
                htmlFor="genre"
                className="text-sm font-medium text-muted-foreground shrink-0"
              >
                Genre
              </label>
              <select
                id="genre"
                className="min-w-0 max-w-full truncate rounded-md border border-border bg-card pl-3 pr-8 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={selectedGenre ?? ""}
                onChange={(e) => setSelectedGenre(e.target.value || undefined)}
              >
                <option value="">Tous</option>
                {tagsData?.tags.map((tag) => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <label
                htmlFor="author"
                className="text-sm font-medium text-muted-foreground shrink-0"
              >
                Auteur
              </label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nom de l'auteur·rice"
                className="min-w-0 max-w-full truncate md:w-48"
                aria-label="Filtrer par auteur"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <label
                htmlFor="minRating"
                className="text-sm font-medium text-muted-foreground shrink-0"
              >
                Note min.
              </label>
              <select
                id="minRating"
                className="min-w-0 max-w-full truncate rounded-md border border-border bg-card pl-3 pr-8 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={minRating ?? ""}
                onChange={(e) =>
                  setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)
                }
              >
                <option value="">Toutes</option>
                <option value="1">1+ / 5</option>
                <option value="2">2+ / 5</option>
                <option value="3">3+ / 5</option>
                <option value="4">4+ / 5</option>
                <option value="4.5">4.5+ / 5</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <label
                htmlFor="readingStatus"
                className="text-sm font-medium text-muted-foreground shrink-0"
              >
                État
              </label>
              <select
                id="readingStatus"
                className="min-w-0 max-w-full truncate rounded-md border border-border bg-card pl-3 pr-8 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={readingStatus ?? ""}
                onChange={(e) =>
                  setReadingStatus(
                    (e.target.value as "to_read" | "reading" | "finished" | undefined) ||
                      undefined,
                  )
                }
              >
                <option value="">Tous</option>
                <option value="to_read">À lire</option>
                <option value="reading">En cours</option>
                <option value="finished">Terminé</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground w-full md:w-auto">
              <input
                type="checkbox"
                checked={includeExternal}
                onChange={(e) => setIncludeExternal(e.target.checked)}
              />
              Inclure Open Library
            </label>
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex w-full items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSuggestOpen(true);
              }}
              onFocus={() => query.trim().length >= 2 && setIsSuggestOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher un titre, un auteur, un utilisateur..."
              aria-label="Rechercher"
              aria-autocomplete="list"
              aria-expanded={shouldShowSuggestDropdown}
              className="flex-1"
            />
            {query ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Effacer la recherche"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Scanner le code-barres d'un livre"
              onClick={() => setIsScanActive(true)}
              className="md:hidden"
            >
              <ScanBarcode className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
          <Button
            type="submit"
            aria-label="Lancer la recherche"
            className="w-full md:w-auto md:ml-auto"
          >
            Rechercher
          </Button>
        </div>
      </form>

      {/* Dropdown suggestions */}
      {shouldShowSuggestDropdown ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          role="listbox"
        >
          {isFetchingSuggestions && !hasSuggestionResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Recherche en cours…
            </div>
          ) : !hasSuggestionResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            (() => {
              let flatIdx = -1;
              return (
                <>
                  {(suggestions?.books.length ?? 0) > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        Livres
                      </div>
                      {suggestions!.books.map((book) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                          <button
                            key={`book-${book.id}`}
                            type="button"
                            role="option"
                            aria-selected={focusedIndex === idx}
                            onClick={() => navigateToSuggestion({ type: "book", data: book })}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/60 ${
                              focusedIndex === idx ? "bg-muted/60" : ""
                            }`}
                          >
                            {book.coverUrl ? (
                              <Image
                                src={book.coverUrl}
                                alt=""
                                width={28}
                                height={40}
                                className="h-10 w-7 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-7 shrink-0 rounded bg-muted" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{book.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {book.author}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {(suggestions?.users.length ?? 0) > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <User className="h-3 w-3" />
                        Utilisateurs
                      </div>
                      {suggestions!.users.map((user) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                          <button
                            key={`user-${user.id}`}
                            type="button"
                            role="option"
                            aria-selected={focusedIndex === idx}
                            onClick={() => navigateToSuggestion({ type: "user", data: user })}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/60 ${
                              focusedIndex === idx ? "bg-muted/60" : ""
                            }`}
                          >
                            {user.avatarUrl ? (
                              <Image
                                src={user.avatarUrl}
                                alt=""
                                width={28}
                                height={28}
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-7 w-7 shrink-0 rounded-full bg-muted" />
                            )}
                            <p className="truncate text-sm font-medium">
                              {user.displayName}
                              {user.username ? (
                                <span className="ml-1 font-normal text-muted-foreground">
                                  @{user.username}
                                </span>
                              ) : null}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {(suggestions?.blog.length ?? 0) > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Blog
                      </div>
                      {suggestions!.blog.map((article) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                          <button
                            key={`blog-${article.slug}`}
                            type="button"
                            role="option"
                            aria-selected={focusedIndex === idx}
                            onClick={() => navigateToSuggestion({ type: "blog", data: article })}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/60 ${
                              focusedIndex === idx ? "bg-muted/60" : ""
                            }`}
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{article.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {article.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {(() => {
                    flatIdx++;
                    const idx = flatIdx;
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={focusedIndex === idx}
                        onClick={() => navigateToSuggestion({ type: "all" })}
                        className={`flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60 ${
                          focusedIndex === idx ? "bg-muted/60" : ""
                        }`}
                      >
                        <span>
                          Voir tous les résultats pour «{" "}
                          <span className="text-primary">{query.trim()}</span> »
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })()}
                </>
              );
            })()
          )}
        </div>
      ) : null}
      </div>

      {/* Filtres actifs */}
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="outline">
              {filter}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Résumé de la recherche */}
      {hasSearchQuery && !isLoading && (booksData || usersData || blogData) ? (
        <p className="text-sm text-muted-foreground mb-4">
          {[
            booksData
              ? `${booksData.supabaseCount + booksData.externalCount} livre${booksData.supabaseCount + booksData.externalCount > 1 ? "s" : ""}`
              : null,
            submittedQuery && usersData
              ? `${usersData.count} utilisateur${usersData.count > 1 ? "s" : ""}`
              : null,
            submittedQuery && blogData
              ? `${blogData.count} article${blogData.count > 1 ? "s" : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      ) : null}

      {/* Chargement global */}
      {hasSearchQuery && isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center py-12">
          <BookLoader size="lg" text="Recherche en cours..." />
        </div>
      ) : null}

      {/* Résultats */}
      {hasSearchQuery && !isLoading ? (
        <div className="space-y-12">
          {/* Section Livres */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Livres</h2>
              {booksData ? (
                <span className="text-sm text-muted-foreground">
                  · {booksData.supabaseCount + booksData.externalCount} résultat
                  {booksData.supabaseCount + booksData.externalCount > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {isErrorBooks ? (
              <ErrorBlock onRetry={refetchBooks} />
            ) : (booksData?.books.length ?? 0) > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {booksData!.books.map((book) => (
                  <SearchResultCard key={`${book.source}-${book.id}`} book={book} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun résultat pour cette recherche. Essayez un autre titre ou élargissez les filtres.
                </p>
                <Button
                  asChild
                  className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                  aria-label="Ajouter un livre manuellement"
                >
                  <Link
                    href={(() => {
                      const params = new URLSearchParams();
                      if (submittedQuery) params.set("title", submittedQuery);
                      if (author.trim()) params.set("author", author.trim());
                      const qs = params.toString();
                      return `/books/create${qs ? `?${qs}` : ""}`;
                    })()}
                  >
                    Ajouter un livre
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* Section Utilisateurs */}
          {submittedQuery ? (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Utilisateurs</h2>
                {usersData ? (
                  <span className="text-sm text-muted-foreground">
                    · {usersData.count} utilisateur{usersData.count > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              {isErrorUsers ? (
                <ErrorBlock onRetry={refetchUsers} />
              ) : (usersData?.users.length ?? 0) > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {usersData!.users.map((user) => (
                    <UserResultCard
                      key={user.id}
                      user={user}
                      initialFollowStatus={user.followStatus ?? "not_following"}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur trouvé pour « {submittedQuery} ».
                </p>
              )}
            </section>
          ) : null}

          {/* Section Blog */}
          {submittedQuery ? (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Blog</h2>
                {blogData ? (
                  <span className="text-sm text-muted-foreground">
                    · {blogData.count} article{blogData.count > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              {isErrorBlog ? (
                <ErrorBlock onRetry={refetchBlog} />
              ) : (blogData?.blog.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {blogData!.blog.map((article) => (
                    <BlogResultRow key={article.slug} article={article} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun article trouvé pour « {submittedQuery} ».
                </p>
              )}
            </section>
          ) : null}
        </div>
      ) : null}

      <ScanFlow isActive={isScanActive} onClose={() => setIsScanActive(false)} />
    </div>
  );
};

const ErrorBlock = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
    <p className="text-sm font-medium">
      Impossible de charger les résultats. Veuillez réessayer.
    </p>
    <Button variant="outline" className="mt-4" onClick={onRetry}>
      Réessayer
    </Button>
  </div>
);

const BlogResultRow = ({ article }: { article: BlogSuggestion }) => (
  <Link
    href={`/blog/${article.slug}`}
    className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-card"
  >
    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
    <div className="min-w-0">
      <p className="font-medium">{article.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {article.description}
      </p>
    </div>
  </Link>
);

export default SearchClient;
