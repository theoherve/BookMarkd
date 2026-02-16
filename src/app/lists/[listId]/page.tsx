import { notFound } from "next/navigation";
import type { Metadata } from "next";

import AddListItemForm from "@/components/lists/add-list-item-form";
import CollaboratorsStack from "@/components/lists/collaborators-stack";
import ShareListButton from "@/components/lists/share-list-button";
import SortableListItems from "@/components/lists/sortable-list-items";

import { getListDetail } from "@/features/lists/server/get-list-detail";
import { getAvailableBooks } from "@/features/lists/server/get-available-books";

import { getCurrentSession } from "@/lib/auth/session";

const BASE_URL = "https://bookmarkd.app";

type ListDetailPageProps = {
  params: Promise<{
    listId: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: ListDetailPageProps): Promise<Metadata> => {
  const resolvedParams = await params;
  const session = await getCurrentSession();
  const viewerId = session?.user?.id ?? null;
  try {
    const detail = await getListDetail(resolvedParams.listId, viewerId);
    const title = `${detail.title} · BookMarkd`;
    const description =
      detail.description?.trim() ||
      `Liste de ${detail.items.length} livre${detail.items.length !== 1 ? "s" : ""} sur BookMarkd.`;
    const url = `${BASE_URL}/lists/${detail.id}`;
    const metadata: Metadata = {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: "BookMarkd",
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
    if (detail.visibility === "private") {
      metadata.robots = { index: false, follow: false };
    }
    return metadata;
  } catch {
    return {
      title: "Liste · BookMarkd",
      robots: { index: false, follow: false },
    };
  }
};

const ListDetailPage = async ({ params }: ListDetailPageProps) => {
  const session = await getCurrentSession();
  const viewerId = session?.user?.id ?? null;
  const resolvedParams = await params;

  const detail = await getListDetail(resolvedParams.listId, viewerId);

  if (!detail) {
    notFound();
  }

  const canEdit = detail.viewerRole === "owner" || detail.viewerRole === "editor";
  const availableBooks = canEdit
    ? await getAvailableBooks(detail.items.map((item) => item.book.id))
    : [];

  return (
    <section className="space-y-8">
      <header className="space-y-4 rounded-xl border border-border/60 bg-card/80 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.visibility === "public"
              ? "Publique"
              : detail.visibility === "unlisted"
                ? "Non répertoriée"
                : "Privée"}
          </span>
          {detail.isCollaborative ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collaborative
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.viewerRole === "owner"
              ? "Vous êtes propriétaire"
              : detail.viewerRole === "editor"
                ? "Vous pouvez éditer"
                : "Consultation"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-foreground">{detail.title}</h1>
          <ShareListButton listId={detail.id} listTitle={detail.title} />
        </div>
        {detail.description ? (
          <p className="text-sm text-muted-foreground">{detail.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun message de présentation pour cette liste.
          </p>
        )}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">{detail.items.length}</strong>{" "}
            livre{detail.items.length > 1 ? "s" : ""} sélectionné{detail.items.length > 1 ? "s" : ""}.
          </span>
          <CollaboratorsStack owner={detail.owner} collaborators={detail.collaborators} />
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {detail.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-8 text-center text-sm text-muted-foreground">
              Aucun livre n&apos;a encore été ajouté à cette liste.
            </div>
          ) : (
            <SortableListItems
              listId={detail.id}
              items={detail.items}
              canEdit={canEdit}
            />
          )}
        </div>
        <aside className="space-y-4">
          <AddListItemForm
            listId={detail.id}
            availableBooks={availableBooks}
            canEdit={canEdit}
          />
        </aside>
      </div>
    </section>
  );
};

export default ListDetailPage;

