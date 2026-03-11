import { getEmailLogs, getEmailStats } from "@/features/admin/server/get-email-logs";
import { EmailLogsTable } from "@/components/admin/emails/email-logs-table";
import { StatCard } from "@/components/admin/shared/stat-card";
import { Check, XCircle, Percent } from "lucide-react";

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    emailType?: string;
    status?: string;
  }>;
};

const AdminEmailsPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, stats] = await Promise.all([
    getEmailLogs({
      page,
      pageSize: 20,
      search: params.search || undefined,
      emailType: params.emailType || undefined,
      status: params.status || undefined,
    }),
    getEmailStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Emails</h1>
        <p className="text-sm text-muted-foreground">Monitoring des emails envoyés</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Envoyés" value={stats.totalSent} icon={Check} />
        <StatCard title="Échoués" value={stats.totalFailed} icon={XCircle} />
        <StatCard title="Taux d'échec" value={`${stats.failureRate}%`} icon={Percent} />
      </div>

      <EmailLogsTable
        logs={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentSearch={params.search ?? ""}
      />
    </div>
  );
};

export default AdminEmailsPage;
