import type { Metadata } from "next";
import { ToggleLeft } from "lucide-react";

import { ModulesToggles } from "@/components/admin/modules/modules-toggles";
import { listSiteModules } from "@/features/modules/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modules",
};

const AdminModulesPage = async () => {
  const modules = await listSiteModules();

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground"
        >
          <ToggleLeft className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Modules</h1>
          <p className="text-sm text-muted-foreground">
            Activez ou désactivez des sections affichées côté front (page d&apos;accueil, etc.).
            Les changements sont immédiats — la page d&apos;accueil est revalidée automatiquement.
          </p>
        </div>
      </header>

      <ModulesToggles modules={modules} />
    </div>
  );
};

export default AdminModulesPage;
