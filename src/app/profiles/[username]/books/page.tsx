import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPublicProfileBooksRead } from "@/features/profile/server/get-public-profile";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";

type ProfileBooksPageProps = {
  params: Promise<{ username: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ProfileBooksPage = async ({ params }: ProfileBooksPageProps) => {
  const { username } = await params;
  const data = await getPublicProfileBooksRead(username);

  if (!data) {
    notFound();
  }

  const { displayName, books } = data;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/profiles/${username}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md w-fit"
            aria-label="Retour au profil"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au profil
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Livres lus par {displayName}
          </h1>
        </div>

        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun livre lu pour le moment.
          </p>
        ) : (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[72px]">Couverture</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="hidden sm:table-cell">Auteur</TableHead>
                  <TableHead className="w-[80px] text-right">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => {
                  const bookSlug = generateBookSlug(book.title, book.author);
                  return (
                    <TableRow key={book.bookId}>
                      <TableCell className="p-2">
                        <Link
                          href={`/books/${bookSlug}`}
                          className="block relative w-12 h-16 shrink-0 overflow-hidden rounded bg-muted"
                          aria-label={`Voir ${book.title}`}
                        >
                          {book.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              —
                            </div>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/books/${bookSlug}`}
                          className="font-medium text-foreground hover:text-accent-foreground line-clamp-2"
                        >
                          {book.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {book.author}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {book.rating != null ? formatRating(book.rating) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProfileBooksPage;
