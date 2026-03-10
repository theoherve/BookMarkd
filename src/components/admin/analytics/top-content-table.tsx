import { EmptyState } from "@/components/admin/shared/empty-state";
import { Eye } from "lucide-react";

type TopContentTableProps = {
  items: { label: string; value: number }[];
};

export const TopContentTable = ({ items }: TopContentTableProps) => {
  if (items.length === 0) {
    return <EmptyState icon={Eye} title="Aucune donnée" description="Pas encore de visites enregistrées." />;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="truncate max-w-[200px] text-muted-foreground">{item.label}</span>
          <span className="font-medium">{item.value.toLocaleString("fr-FR")}</span>
        </div>
      ))}
    </div>
  );
};
