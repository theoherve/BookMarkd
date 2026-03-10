"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, BookOpen, User, FileText, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchSuggestions } from "@/features/search/api/use-search-suggestions";
import { generateBookSlug } from "@/lib/slug";
import type { SearchBook, SearchUser, BlogSuggestion } from "@/features/search/types";

type SearchInputProps = {
  defaultValue?: string;
  placeholder?: string;
  /** Appelé quand l'utilisateur valide la recherche (Entrée ou bouton) */
  onSubmit?: (query: string) => void;
  /** Si true, désactive le dropdown (ex: sur la page /search elle-même) */
  disableSuggestions?: boolean;
};

const SearchInput = ({
  defaultValue = "",
  placeholder = "Rechercher un titre, un auteur, un utilisateur...",
  onSubmit,
  disableSuggestions = false,
}: SearchInputProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions, isFetching } = useSearchSuggestions(
    disableSuggestions ? "" : query,
  );

  const hasResults =
    (suggestions?.books.length ?? 0) > 0 ||
    (suggestions?.users.length ?? 0) > 0 ||
    (suggestions?.blog.length ?? 0) > 0;

  const shouldShowDropdown =
    !disableSuggestions && isOpen && query.trim().length >= 2;

  // Aplatir toutes les suggestions pour la navigation clavier
  type SuggestionItem =
    | { type: "book"; data: SearchBook }
    | { type: "user"; data: SearchUser }
    | { type: "blog"; data: BlogSuggestion }
    | { type: "all" };

  const flatItems: SuggestionItem[] = [
    ...(suggestions?.books.map((b) => ({ type: "book" as const, data: b })) ?? []),
    ...(suggestions?.users.map((u) => ({ type: "user" as const, data: u })) ?? []),
    ...(suggestions?.blog.map((b) => ({ type: "blog" as const, data: b })) ?? []),
    ...(hasResults || isFetching ? [{ type: "all" as const }] : []),
  ];

  const getItemHref = (item: SuggestionItem): string => {
    if (item.type === "book") {
      return `/books/${generateBookSlug(item.data.title, item.data.author)}`;
    }
    if (item.type === "user") {
      return `/profiles/${item.data.username ?? item.data.id}`;
    }
    if (item.type === "blog") {
      return `/blog/${item.data.slug}`;
    }
    return `/search?q=${encodeURIComponent(query.trim())}`;
  };

  const navigateToItem = (item: SuggestionItem) => {
    setIsOpen(false);
    router.push(getItemHref(item));
  };

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (onSubmit) {
      onSubmit(trimmed);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === "Enter" && focusedIndex >= 0) {
      event.preventDefault();
      const item = flatItems[focusedIndex];
      if (item) navigateToItem(item);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Réinitialiser le focus quand les suggestions changent
  useEffect(() => {
    setFocusedIndex(-1);
  }, [suggestions]);

  let flatIdx = -1;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur md:flex-row md:items-center"
      >
        <div className="flex w-full items-center gap-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Rechercher"
            aria-autocomplete="list"
            aria-expanded={shouldShowDropdown}
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
        </div>
        <Button
          type="submit"
          aria-label="Lancer la recherche"
          className="w-full md:w-auto md:ml-auto"
        >
          Rechercher
        </Button>
      </form>

      {/* Dropdown suggestions */}
      {shouldShowDropdown ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          role="listbox"
        >
          {isFetching && !hasResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Recherche en cours…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            <>
              {/* Livres */}
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
                        onClick={() => navigateToItem({ type: "book", data: book })}
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

              {/* Utilisateurs */}
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
                        onClick={() => navigateToItem({ type: "user", data: user })}
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

              {/* Blog */}
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
                        onClick={() =>
                          navigateToItem({ type: "blog", data: article })
                        }
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted/60 ${
                          focusedIndex === idx ? "bg-muted/60" : ""
                        }`}
                      >
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {article.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {article.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* Voir tous les résultats */}
              {(() => {
                flatIdx++;
                const idx = flatIdx;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={focusedIndex === idx}
                    onClick={() =>
                      navigateToItem({ type: "all" })
                    }
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
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchInput;
