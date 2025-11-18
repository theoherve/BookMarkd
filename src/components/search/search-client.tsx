"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, X, Filter } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBookSearch } from "@/features/search/api/use-book-search";
import { useUserSearch } from "@/features/search/api/use-user-search";
import SearchResultCard from "@/components/search/search-result-card";
import UserResultCard from "@/components/search/user-result-card";
import { useTagsQuery } from "@/features/search/api/use-tags-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type SearchTab = "books" | "users";

const SearchClient = () => {
  const [activeTab, setActiveTab] = useState<SearchTab>("books");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [readingStatus, setReadingStatus] = useState<"to_read" | "reading" | "finished" | undefined>();
  const [author, setAuthor] = useState<string>("");
  const [includeExternal, setIncludeExternal] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const { data: tagsData } = useTagsQuery();

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
    Boolean((submittedQuery || selectedGenre || minRating || readingStatus || author) && activeTab === "books"),
  );

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useUserSearch(
    {
      q: submittedQuery,
    },
    Boolean(submittedQuery && activeTab === "users"),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
  };

  const hasBookResults = (booksData?.books?.length ?? 0) > 0;
  const hasUserResults = (usersData?.users?.length ?? 0) > 0;

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

  return (
    <div className="space-y-8">
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("books")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "books"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Rechercher des livres"
        >
          Livres
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Rechercher des utilisateurs"
        >
          Utilisateurs
        </button>
      </div>

      {/* Filters will render inside the card (form) below */}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur"
      >
        {activeTab === "books" && showFilters ? (
          <div className="flex w-full flex-wrap items-center gap-4 rounded-xl bg-card/70 p-2">
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
                onChange={(event) =>
                  setSelectedGenre(event.target.value || undefined)
                }
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
                onChange={(event) => setAuthor(event.target.value)}
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
                onChange={(event) =>
                  setMinRating(event.target.value ? parseFloat(event.target.value) : undefined)
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
                onChange={(event) =>
                  setReadingStatus(event.target.value as "to_read" | "reading" | "finished" | undefined || undefined)
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
                onChange={(event) => setIncludeExternal(event.target.checked)}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                activeTab === "books"
                  ? "Rechercher un titre, une autrice..."
                  : "Rechercher un utilisateur..."
              }
              aria-label={
                activeTab === "books"
                  ? "Rechercher un livre"
                  : "Rechercher un utilisateur"
              }
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
            {activeTab === "books" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
          <Button type="submit" aria-label="Lancer la recherche" className="w-full md:w-auto md:ml-auto">
            Rechercher
          </Button>
        </div>
      </form>

      {activeTab === "books" && activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="outline">
              {filter}
            </Badge>
          ))}
        </div>
      ) : null}

      {activeTab === "books" && (isLoadingBooks || isFetchingBooks) ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : null}

      {activeTab === "users" && (isLoadingUsers || isFetchingUsers) ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : null}

      {activeTab === "books" && isErrorBooks ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <p className="text-sm font-medium">
            Impossible de charger les résultats. Veuillez réessayer.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetchBooks()}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {activeTab === "users" && isErrorUsers ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <p className="text-sm font-medium">
            Impossible de charger les résultats. Veuillez réessayer.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetchUsers()}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {activeTab === "books" && !isLoadingBooks && !isFetchingBooks && booksData ? (
        <>
          <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {booksData.supabaseCount} résultat(s) BookMarkd, {booksData.externalCount}{" "}
              via Open Library.
            </p>
            {submittedQuery ? (
              <p className="italic">
                Résultats pour « {submittedQuery} »
              </p>
            ) : null}
          </div>

          {hasBookResults ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {booksData.books.map((book) => (
                <SearchResultCard key={`${book.source}-${book.id}`} book={book} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun résultat pour cette recherche. Essayez un autre titre ou élargissez les filtres.
              </p>
              {booksData.supabaseCount === 0 && booksData.externalCount === 0 ? (
                <Button asChild className="mt-4" aria-label="Ajouter un livre manuellement">
                  <Link 
                    href={(() => {
                      const params = new URLSearchParams();
                      if (submittedQuery) {
                        params.set("title", submittedQuery);
                      }
                      if (author.trim()) {
                        params.set("author", author.trim());
                      }
                      const queryString = params.toString();
                      return `/books/create${queryString ? `?${queryString}` : ""}`;
                    })()}
                  >
                    Ajouter un livre
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {activeTab === "users" && !isLoadingUsers && !isFetchingUsers && usersData ? (
        <>
          <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {usersData.count} utilisateur{usersData.count > 1 ? "s" : ""} trouvé{usersData.count > 1 ? "s" : ""}
            </p>
            {submittedQuery ? (
              <p className="italic">
                Résultats pour « {submittedQuery} »
              </p>
            ) : null}
          </div>

          {hasUserResults ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {usersData.users.map((user) => (
                <UserResultCard key={user.id} user={user} initialFollowStatus={user.followStatus ?? "not_following"} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur trouvé pour cette recherche. Essayez un autre nom.
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default SearchClient;

