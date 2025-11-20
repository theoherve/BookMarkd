"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { importGoogleBooksBook } from "@/server/actions/import-google-books";
import { generateBookSlug } from "@/lib/slug";

type ImportGoogleBooksButtonProps = {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  summary?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
};

const ImportGoogleBooksButton = ({
  googleBooksId,
  title,
  author,
  coverUrl,
  publicationYear,
  summary,
  isbn,
  publisher,
  language,
}: ImportGoogleBooksButtonProps) => {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importedBookId, setImportedBookId] = useState<string | null>(null);

  const handleImport = () => {
    startTransition(async () => {
      const result = await importGoogleBooksBook({
        googleBooksId,
        title,
        author,
        coverUrl,
        publicationYear,
        summary,
        isbn,
        publisher,
        language,
      });

      if (result.success) {
        setImportedBookId(result.bookId);
        setFeedback("Livre importé dans BookMarkd ✅");
        router.refresh();
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleImport}
        disabled={isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        {isPending ? "Import..." : "Importer dans BookMarkd"}
      </Button>
      {feedback ? (
        <p className="text-xs text-muted-foreground">
          {feedback}{" "}
          {importedBookId ? (
            <Button
              variant="link"
              className="h-auto p-0 text-xs font-medium"
              asChild
            >
              <a href={`/books/${generateBookSlug(title, author)}`}>Ouvrir la fiche</a>
            </Button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
};

export default ImportGoogleBooksButton;

