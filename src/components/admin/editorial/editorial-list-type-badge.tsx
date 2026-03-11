import { Badge } from "@/components/ui/badge";
import type { EditorialListType, EditorialListSource } from "@/types/editorial";

const TYPE_CONFIG: Record<EditorialListType, { label: string; className: string }> = {
  bestseller: { label: "Best-seller", className: "bg-amber-100 text-amber-800 border-amber-200" },
  award: { label: "Prix littéraire", className: "bg-purple-100 text-purple-800 border-purple-200" },
  selection: { label: "Sélection", className: "bg-blue-100 text-blue-800 border-blue-200" },
  new_releases: { label: "Nouveautés", className: "bg-green-100 text-green-800 border-green-200" },
};

const SOURCE_CONFIG: Record<EditorialListSource, { label: string; className: string }> = {
  nytimes: { label: "NY Times", className: "bg-gray-100 text-gray-700 border-gray-200" },
  manual: { label: "Manuel", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export const EditorialTypeBadge = ({ type }: { type: EditorialListType }) => {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const EditorialSourceBadge = ({ source }: { source: EditorialListSource }) => {
  const config = SOURCE_CONFIG[source];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
