"use client";

import { Users, BookOpen, MessageSquare, List, TrendingUp, Clock, ScanBarcode } from "lucide-react";
import { StatCardWithDetail } from "@/components/admin/shared/stat-card-with-detail";
import type { DashboardStats } from "@/types/admin";

type KpiCardsProps = {
  stats: DashboardStats;
};

export const DashboardKpiCards = ({ stats }: KpiCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCardWithDetail
        title="Utilisateurs"
        value={stats.totalUsers.toLocaleString("fr-FR")}
        icon={Users}
        detailType="users"
        detailTitle="Derniers inscrits (10 derniers)"
      />
      <StatCardWithDetail
        title="Livres"
        value={stats.totalBooks.toLocaleString("fr-FR")}
        icon={BookOpen}
        detailType="books"
        detailTitle="Derniers livres ajoutés (10 derniers)"
      />
      <StatCardWithDetail
        title="Livres scannés"
        value={stats.totalScannedBooks.toLocaleString("fr-FR")}
        icon={ScanBarcode}
        detailType="scanned-books"
        detailTitle="Derniers livres scannés (10 derniers)"
      />
      <StatCardWithDetail
        title="Avis"
        value={stats.totalReviews.toLocaleString("fr-FR")}
        icon={MessageSquare}
        detailType="reviews"
        detailTitle="Derniers avis (10 derniers)"
      />
      <StatCardWithDetail
        title="Listes"
        value={stats.totalLists.toLocaleString("fr-FR")}
        icon={List}
        detailType="lists"
        detailTitle="Dernières listes créées (10 dernières)"
      />
      <StatCardWithDetail
        title="Actifs (30j)"
        value={stats.activeUsers30d.toLocaleString("fr-FR")}
        icon={TrendingUp}
        detailType="active-users"
        detailTitle="Utilisateurs les plus récemment actifs (10 derniers)"
      />
      <StatCardWithDetail
        title="Nouveaux aujourd'hui"
        value={stats.newUsersToday}
        icon={Clock}
        detailType="new-today"
        detailTitle="Inscrits aujourd'hui"
      />
      <StatCardWithDetail
        title="Nouveaux cette semaine"
        value={stats.newUsersThisWeek}
        icon={Clock}
        detailType="new-week"
        detailTitle="Inscrits cette semaine"
      />
      <StatCardWithDetail
        title="Feedback en attente"
        value={stats.pendingFeedbacks}
        icon={MessageSquare}
        detailType="pending-feedbacks"
        detailTitle="Feedbacks en attente (10 derniers)"
      />
    </div>
  );
};
