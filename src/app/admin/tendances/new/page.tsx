import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { EditorialListForm } from "@/components/admin/editorial/editorial-list-form";

export const metadata: Metadata = {
  title: "Nouvelle liste éditoriale",
};

const NewEditorialListPage = () => {
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
        <h1 className="text-2xl font-bold">Nouvelle liste éditoriale</h1>
        <p className="text-sm text-muted-foreground">
          Créez une liste manuelle (prix littéraire, sélection saisonnière, etc.).
          Les listes NY Times sont créées automatiquement chaque lundi.
        </p>
      </div>
      <EditorialListForm />
    </div>
  );
};

export default NewEditorialListPage;
