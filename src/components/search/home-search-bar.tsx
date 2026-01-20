"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HomeSearchBar = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur md:flex-row md:items-center"
    >
      <div className="flex w-full items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un titre, une autrice..."
          aria-label="Rechercher un livre"
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
      <Button type="submit" aria-label="Lancer la recherche" className="w-full md:w-auto md:ml-auto">
        Rechercher
      </Button>
    </form>
  );
};

export default HomeSearchBar;
