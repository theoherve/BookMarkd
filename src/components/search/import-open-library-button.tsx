"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { importOpenLibraryBook } from "@/server/actions/import-open-library";
import { generateBookSlug } from "@/lib/slug";

type ImportOpenLibraryButtonProps = {
  openLibraryId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  summary?: string | null;
};

const ImportOpenLibraryButton = ({
  openLibraryId,
  title,
  author,
  coverUrl,
  publicationYear,
  summary,
}: ImportOpenLibraryButtonProps) => {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importedBookId, setImportedBookId] = useState<string | null>(null);

  const handleImport = () => {
    startTransition(async () => {
      const result = await importOpenLibraryBook({
        openLibraryId,
        title,
        author,
        coverUrl,
        publicationYear,
        summary,
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

export default ImportOpenLibraryButton;

