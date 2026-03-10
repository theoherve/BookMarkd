import { BlogPostForm } from "@/components/admin/blog/blog-post-form";

const NewBlogPostPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvel article</h1>
        <p className="text-sm text-muted-foreground">Créez un nouvel article de blog</p>
      </div>
      <BlogPostForm />
    </div>
  );
};

export default NewBlogPostPage;
