import { notFound } from "next/navigation";
import { getUserDetail } from "@/features/admin/server/get-user-detail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/shared/stat-card";
import { BookOpen, MessageSquare, List, Users, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ userId: string }>;
};

const AdminUserDetailPage = async ({ params }: Props) => {
  const { userId } = await params;
  const user = await getUserDetail(userId);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user.username ? `@${user.username}` : user.email}
          </p>
        </div>
        <div className="flex gap-1">
          {user.isAdmin && <Badge>Admin</Badge>}
          {user.disabledAt && <Badge variant="destructive">Désactivé</Badge>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Livres" value={user.booksCount} icon={BookOpen} />
        <StatCard title="Avis" value={user.reviewsCount} icon={MessageSquare} />
        <StatCard title="Listes" value={user.listsCount} icon={List} />
        <StatCard title="Abonnés" value={user.followersCount} icon={Users} />
        <StatCard title="Abonnements" value={user.followingCount} icon={Heart} />
      </div>

      {/* Reading stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Statistiques de lecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{user.readingStats.toRead}</div>
              <div className="text-xs text-muted-foreground">À lire</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{user.readingStats.reading}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{user.readingStats.finished}</div>
              <div className="text-xs text-muted-foreground">Terminés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inscrit le</span>
            <span>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
          {user.bio && (
            <div>
              <span className="text-muted-foreground">Bio</span>
              <p className="mt-1">{user.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      {user.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between text-sm">
                  <Badge variant="secondary" className="text-[10px]">
                    {activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUserDetailPage;
