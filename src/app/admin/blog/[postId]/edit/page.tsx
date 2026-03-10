import { notFound } from "next/navigation";
import { getBlogPostDetail } from "@/features/admin/server/get-blog-posts-list";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ postId: string }>;
};

const EditBlogPostPage = async ({ params }: Props) => {
  const { postId } = await params;
  const post = await getBlogPostDetail(postId);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/blog"><Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Modifier l&apos;article</h1>
          <p className="text-sm text-muted-foreground">{post.title}</p>
        </div>
      </div>
      <BlogPostForm post={post} />
    </div>
  );
};

export default EditBlogPostPage;
