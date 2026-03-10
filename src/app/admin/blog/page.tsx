import { getBlogPostsList } from "@/features/admin/server/get-blog-posts-list";
import { BlogPostsTable } from "@/components/admin/blog/blog-posts-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
};

const AdminBlogPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getBlogPostsList({
    page,
    pageSize: 20,
    search: params.search || undefined,
    status: params.status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">Gérez les articles de blog</p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm"><Plus className="mr-1 size-4" /> Nouvel article</Button>
        </Link>
      </div>
      <BlogPostsTable
        posts={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        currentSearch={params.search ?? ""}
      />
    </div>
  );
};

export default AdminBlogPage;
