import { getUsersList } from "@/features/admin/server/get-users-list";
import { UsersTable } from "@/components/admin/users/users-table";

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

const AdminUsersPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";
  const status = params.status as "active" | "disabled" | undefined;

  const result = await getUsersList({
    page,
    pageSize: 20,
    search: search || undefined,
    sortBy: params.sortBy ?? "created_at",
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
    status,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les utilisateurs de la plateforme
        </p>
      </div>

      <UsersTable
        users={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentSearch={search}
      />
    </div>
  );
};

export default AdminUsersPage;
