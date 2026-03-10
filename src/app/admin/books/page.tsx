import { getBooksList } from "@/features/admin/server/get-books-list";
import { BooksTable } from "@/components/admin/books/books-table";

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
};

const AdminBooksPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";

  const result = await getBooksList({
    page,
    pageSize: 20,
    search: search || undefined,
    sortBy: params.sortBy ?? "created_at",
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Livres</h1>
        <p className="text-sm text-muted-foreground">
          Gérez le catalogue de livres
        </p>
      </div>
      <BooksTable
        books={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentSearch={search}
      />
    </div>
  );
};

export default AdminBooksPage;
