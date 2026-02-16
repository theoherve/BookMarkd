import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const BlogPreview = () => {
  const posts = getAllPosts().slice(0, 3);

  if (posts.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <article className="group rounded-xl border border-border/60 bg-card/80 p-6 transition hover:border-border hover:bg-card">
            <time
              dateTime={post.publishedAt.toISOString()}
              className="text-muted-foreground text-xs"
            >
              {post.publishedAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              <Link
                href={`/blog/${post.slug}`}
                className="hover:text-primary underline-offset-2 hover:underline"
              >
                {post.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
              {post.description}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
              aria-label={`Lire l'article : ${post.title}`}
            >
              Lire l&apos;article →
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default BlogPreview;
