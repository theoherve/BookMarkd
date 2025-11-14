"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBookSearch } from "@/features/search/api/use-book-search";
import SearchResultCard from "@/components/search/search-result-card";
import { useTagsQuery } from "@/features/search/api/use-tags-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const SearchClient = () => {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [includeExternal, setIncludeExternal] = useState(true);

  const { data: tagsData } = useTagsQuery();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useBookSearch(
    {
      q: submittedQuery,
      genre: selectedGenre,
      includeExternal,
    },
    Boolean(submittedQuery || selectedGenre),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
  };

  const hasResults = (data?.books?.length ?? 0) > 0;

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (selectedGenre) {
      const tag = tagsData?.tags.find((item) => item.slug === selectedGenre);
      filters.push(tag?.name ?? selectedGenre);
    }
    if (!includeExternal) {
      filters.push("Catalogue BookMarkd uniquement");
    }
    return filters;
  }, [selectedGenre, includeExternal, tagsData?.tags]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:gap-6"
      >
        <div className="flex w-full flex-1 items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un titre, une autrice..."
            aria-label="Rechercher un livre"
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
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="genre"
              className="text-sm font-medium text-muted-foreground"
            >
              Genre
            </label>
            <select
              id="genre"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeExternal}
              onChange={(event) => setIncludeExternal(event.target.checked)}
            />
            Inclure Open Library
          </label>

          <Button type="submit" aria-label="Lancer la recherche">
            Rechercher
          </Button>
        </div>
      </form>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="outline">
              {filter}
            </Badge>
          ))}
        </div>
      ) : null}

      {isLoading || isFetching ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          <p className="text-sm font-medium">
            Impossible de charger les résultats. Veuillez réessayer.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {!isLoading && !isFetching && data ? (
        <>
          <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {data.supabaseCount} résultat(s) BookMarkd, {data.externalCount}{" "}
              via Open Library.
            </p>
            {submittedQuery ? (
              <p className="italic">
                Résultats pour « {submittedQuery} »
              </p>
            ) : null}
          </div>

          {hasResults ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.books.map((book) => (
                <SearchResultCard key={`${book.source}-${book.id}`} book={book} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour cette recherche. Essayez un autre titre ou
              élargissez les filtres.
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default SearchClient;

