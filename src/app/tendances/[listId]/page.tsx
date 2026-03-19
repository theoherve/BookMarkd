import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { EditorialBookRow } from "@/components/editorial/editorial-book-row";
import { getPublishedEditorialListById } from "@/features/editorial/server/get-published-editorial-lists";
import type { PublishedEditorialList } from "@/types/editorial";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ listId: string }>;
};

const TYPE_BADGE: Record<PublishedEditorialList["type"], { label: string; className: string }> = {
  bestseller: { label: "Best-seller", className: "bg-amber-100 text-amber-800 border-amber-200" },
  award: { label: "Prix littéraire", className: "bg-purple-100 text-purple-800 border-purple-200" },
  selection: { label: "Sélection", className: "bg-blue-100 text-blue-800 border-blue-200" },
  new_releases: { label: "Nouveautés", className: "bg-green-100 text-green-800 border-green-200" },
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { listId } = await params;
  const list = await getPublishedEditorialListById(listId);
  if (!list) return { title: "Liste introuvable" };
  return {
    title: `${list.title} — BookMarkd`,
    description: list.description ?? `Découvrez les ${list.books.length} livres de cette sélection.`,
  };
};

const EditorialListDetailPage = async ({ params }: Props) => {
  const { listId } = await params;
  const list = await getPublishedEditorialListById(listId);

  if (!list) notFound();

  const typeBadge = TYPE_BADGE[list.type];
  const isSemester = list.periodType === "semester";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Back */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${typeBadge.className} text-xs`}>
              {list.badgeLabel ?? typeBadge.label}
            </Badge>
            {isSemester && list.semesterLabel && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                {list.semesterLabel}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{list.title}</h1>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {list.books.length} livre{list.books.length > 1 ? "s" : ""}
            {isSemester && list.periodStart && list.periodEnd && (
              <> &middot; {new Date(list.periodStart).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} — {new Date(list.periodEnd).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>

        {/* Book list */}
        <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/80 backdrop-blur">
          {list.books.map((book, i) => (
            <EditorialBookRow key={book.id} book={book} rank={i + 1} />
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default EditorialListDetailPage;
