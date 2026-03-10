import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { Activity } from "lucide-react";

type RecentAdminActivity = {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  userName?: string;
};

const ACTIVITY_LABELS: Record<string, string> = {
  rating: "Note",
  review: "Avis",
  status_change: "Statut",
  list_update: "Liste",
  follow: "Abonnement",
};

type RecentActivityFeedProps = {
  activities: RecentAdminActivity[];
};

export const RecentActivityFeed = ({ activities }: RecentActivityFeedProps) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Activity} title="Aucune activité récente" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[300px] overflow-y-auto">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start justify-between gap-2 border-b pb-2 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-medium">{activity.userName ?? "Utilisateur"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {ACTIVITY_LABELS[activity.type] ?? activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
