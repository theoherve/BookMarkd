import { Users, BookOpen, MessageSquare, List, TrendingUp, Clock, ScanBarcode } from "lucide-react";
import { StatCard } from "@/components/admin/shared/stat-card";
import type { DashboardStats } from "@/types/admin";

type KpiCardsProps = {
  stats: DashboardStats;
};

export const DashboardKpiCards = ({ stats }: KpiCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Utilisateurs"
        value={stats.totalUsers.toLocaleString("fr-FR")}
        icon={Users}
      />
      <StatCard
        title="Livres"
        value={stats.totalBooks.toLocaleString("fr-FR")}
        icon={BookOpen}
      />
      <StatCard
        title="Livres scannés"
        value={stats.totalScannedBooks.toLocaleString("fr-FR")}
        icon={ScanBarcode}
      />
      <StatCard
        title="Avis"
        value={stats.totalReviews.toLocaleString("fr-FR")}
        icon={MessageSquare}
      />
      <StatCard
        title="Listes"
        value={stats.totalLists.toLocaleString("fr-FR")}
        icon={List}
      />
      <StatCard
        title="Actifs (30j)"
        value={stats.activeUsers30d.toLocaleString("fr-FR")}
        icon={TrendingUp}
      />
      <StatCard
        title="Nouveaux aujourd'hui"
        value={stats.newUsersToday}
        icon={Clock}
      />
      <StatCard
        title="Nouveaux cette semaine"
        value={stats.newUsersThisWeek}
        icon={Clock}
      />
      <StatCard
        title="Feedback en attente"
        value={stats.pendingFeedbacks}
        icon={MessageSquare}
      />
    </div>
  );
};
