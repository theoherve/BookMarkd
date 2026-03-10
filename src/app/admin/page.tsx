import { getDashboardStats } from "@/features/admin/server/get-dashboard-stats";
import { getRegistrationsChartData } from "@/features/admin/server/get-registrations-chart-data";
import { getMostReadBooks, getRecentActivities } from "@/features/admin/server/get-popular-content";
import { DashboardKpiCards } from "@/components/admin/dashboard/kpi-cards";
import { RegistrationsChart } from "@/components/admin/dashboard/registrations-chart";
import { PopularBooksChart } from "@/components/admin/dashboard/popular-books-chart";
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";

const AdminDashboardPage = async () => {
  const [stats, chartData, popularBooks, recentActivities] = await Promise.all([
    getDashboardStats(),
    getRegistrationsChartData(30),
    getMostReadBooks(5),
    getRecentActivities(15),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme BookMarkd
        </p>
      </div>

      <DashboardKpiCards stats={stats} />

      <RegistrationsChart data={chartData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PopularBooksChart books={popularBooks} />
        <RecentActivityFeed activities={recentActivities} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
