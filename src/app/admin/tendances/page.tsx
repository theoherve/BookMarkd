import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorialListsTable } from "@/components/admin/editorial/editorial-lists-table";
import { getAdminEditorialLists } from "@/features/editorial/server/get-admin-editorial-lists";
import type { EditorialListStatus } from "@/types/editorial";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tendances & Actu",
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const AdminEditorialPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const status = (params.status as EditorialListStatus | "all") ?? "all";

  const result = await getAdminEditorialLists({ status, pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tendances & Actu</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les listes éditoriales affichées sur la home (NY Times auto + curation manuelle).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/tendances/new">
            <Plus className="mr-2 size-4" />
            Nouvelle liste
          </Link>
        </Button>
      </div>

      {result.pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">
            {result.pendingCount} liste{result.pendingCount > 1 ? "s" : ""} en attente de validation
          </span>
          <span className="text-yellow-600">— Vérifiez les brouillons NY Times avant de publier.</span>
        </div>
      )}

      <Tabs defaultValue={status} className="w-full">
        <TabsList className="flex gap-1 p-1">
          <TabsTrigger value="all" asChild>
            <Link href="/admin/tendances?status=all">Toutes</Link>
          </TabsTrigger>
          <TabsTrigger value="draft" asChild>
            <Link href="/admin/tendances?status=draft">
              Brouillons
              {result.pendingCount > 0 && (
                <Badge className="ml-1.5 h-4 min-w-4 rounded-full px-1 text-[10px]">
                  {result.pendingCount}
                </Badge>
              )}
            </Link>
          </TabsTrigger>
          <TabsTrigger value="published" asChild>
            <Link href="/admin/tendances?status=published">Publiées</Link>
          </TabsTrigger>
          <TabsTrigger value="archived" asChild>
            <Link href="/admin/tendances?status=archived">Archivées</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-4">
          <EditorialListsTable lists={result.data} total={result.total} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEditorialPage;
