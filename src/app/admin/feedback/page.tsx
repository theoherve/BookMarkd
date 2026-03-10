import { getFeedbackList } from "@/features/admin/server/get-feedback-list";
import { getFeedbackStats } from "@/features/admin/server/get-feedback-stats";
import { FeedbackAdminTable } from "@/components/admin/feedback/feedback-table";
import { StatCard } from "@/components/admin/shared/stat-card";
import { MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
  }>;
};

const AdminFeedbackPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, stats] = await Promise.all([
    getFeedbackList({
      page,
      pageSize: 20,
      search: params.search || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
    }),
    getFeedbackStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-muted-foreground">Bugs signalés et suggestions des utilisateurs</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={MessageSquare} />
        <StatCard title="En attente" value={stats.pending} icon={Clock} />
        <StatCard title="Résolus" value={stats.resolved} icon={CheckCircle} />
        <StatCard title="Rejetés" value={stats.rejected} icon={XCircle} />
      </div>

      <FeedbackAdminTable
        feedbacks={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentSearch={params.search ?? ""}
        currentStatus={params.status ?? ""}
        currentType={params.type ?? ""}
      />
    </div>
  );
};

export default AdminFeedbackPage;
