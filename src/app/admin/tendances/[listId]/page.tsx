import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EditorialListForm } from "@/components/admin/editorial/editorial-list-form";
import { EditorialListDetail } from "@/components/admin/editorial/editorial-list-detail";
import { getAdminEditorialListDetail } from "@/features/editorial/server/get-admin-editorial-lists";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier la liste",
};

type Props = {
  params: Promise<{ listId: string }>;
};

const EditorialListDetailPage = async ({ params }: Props) => {
  const { listId } = await params;
  const list = await getAdminEditorialListDetail(listId);

  if (!list) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tendances"
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour aux tendances
        </Link>
        <h1 className="text-2xl font-bold">{list.title}</h1>
        {list.description && (
          <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
        )}
      </div>

      {/* Actions + books */}
      <EditorialListDetail list={{ ...list, books: list.books }} />

      <Separator />

      {/* Edit metadata */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Modifier les informations</h2>
        <EditorialListForm
          listId={list.id}
          defaultValues={{
            title: list.title,
            description: list.description,
            type: list.type,
            badgeLabel: list.badgeLabel,
            expiresAt: list.expiresAt,
            displayOrder: list.displayOrder,
          }}
        />
      </div>
    </div>
  );
};

export default EditorialListDetailPage;
