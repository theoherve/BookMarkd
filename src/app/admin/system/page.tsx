import { requireAdmin } from "@/lib/auth/require-admin";
import { getSystemHealthChecks, getQuotaHistory } from "@/server/actions/admin/system";
import { QuotaHistoryChart } from "@/components/admin/system/quota-history-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Mail,
  BookOpen,
} from "lucide-react";

const statusConfig = {
  healthy: {
    label: "OK",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  warning: {
    label: "Attention",
    variant: "secondary" as const,
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  error: {
    label: "Erreur",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

const serviceIcons: Record<string, typeof Activity> = {
  "Google Books API": BookOpen,
  "Supabase (PostgreSQL)": Server,
  "Resend (Email)": Mail,
};

const SystemPage = async () => {
  await requireAdmin();

  const [checks, quotaHistory] = await Promise.all([
    getSystemHealthChecks(),
    getQuotaHistory(30),
  ]);

  const overallStatus = checks.some((c) => c.status === "error")
    ? "error"
    : checks.some((c) => c.status === "warning")
      ? "warning"
      : "healthy";

  const overall = statusConfig[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Santé du système</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring des services externes et internes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OverallIcon className={`size-5 ${overall.color}`} />
          <Badge variant={overall.variant}>{overall.label}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => {
          const config = statusConfig[check.status];
          const StatusIcon = config.icon;
          const ServiceIcon = serviceIcons[check.service] ?? Activity;

          return (
            <Card key={check.service} className="gap-0">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <ServiceIcon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    {check.service}
                  </CardTitle>
                </div>
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className="size-3" />
                  {config.label}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{check.message}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {check.latency !== undefined && (
                    <span>Latence : {check.latency}ms</span>
                  )}
                  <span>
                    Vérifié :{" "}
                    {new Date(check.lastChecked).toLocaleTimeString("fr-FR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {quotaHistory.length > 0 && <QuotaHistoryChart data={quotaHistory} />}

      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Informations environnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Node.js</dt>
              <dd>{process.version}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Environnement</dt>
              <dd>{process.env.NODE_ENV ?? "development"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Supabase URL
              </dt>
              <dd className="truncate">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configuré" : "Non configuré"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Resend API</dt>
              <dd>
                {process.env.RESEND_API_KEY || process.env.BOOK_MARKD_RESEND_API_KEY
                  ? "Configuré"
                  : "Non configuré"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPage;
