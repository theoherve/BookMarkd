import { getPageViewsOverTime, getTopPages, getTopViewedBooks, getTopBlogPosts } from "@/features/admin/server/get-analytics-data";
import { AnalyticsViewsChart } from "@/components/admin/analytics/views-chart";
import { TopContentTable } from "@/components/admin/analytics/top-content-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/shared/stat-card";
import { Eye, BookOpen, FileText, Globe } from "lucide-react";

const AdminAnalyticsPage = async () => {
  const [pageViews, topPages, topBooks, topPosts] = await Promise.all([
    getPageViewsOverTime(30),
    getTopPages(30, 10),
    getTopViewedBooks(30, 10),
    getTopBlogPosts(30, 10),
  ]);

  const totalPageViews = pageViews.reduce((acc, p) => acc + p.value, 0);
  const totalBookViews = topBooks.reduce((acc, b) => acc + b.views, 0);
  const totalBlogViews = topPosts.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytiques</h1>
        <p className="text-sm text-muted-foreground">Statistiques de visites et de contenu (30 derniers jours)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Pages vues" value={totalPageViews.toLocaleString("fr-FR")} icon={Globe} />
        <StatCard title="Vues livres" value={totalBookViews.toLocaleString("fr-FR")} icon={BookOpen} />
        <StatCard title="Vues articles" value={totalBlogViews.toLocaleString("fr-FR")} icon={FileText} />
      </div>

      <AnalyticsViewsChart data={pageViews} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Pages les plus visitées</CardTitle></CardHeader>
          <CardContent><TopContentTable items={topPages.map((p) => ({ label: p.path, value: p.views }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Livres les plus vus</CardTitle></CardHeader>
          <CardContent><TopContentTable items={topBooks.map((b) => ({ label: b.title, value: b.views }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Articles les plus lus</CardTitle></CardHeader>
          <CardContent><TopContentTable items={topPosts.map((p) => ({ label: p.slug, value: p.views }))} /></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
