import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const BlogPreview = async () => {
  const posts = (await getAllPosts()).slice(0, 3);

  if (posts.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/blog/${post.slug}`}
            aria-label={`Lire l'article : ${post.title}`}
            className="group block rounded-xl border border-border/60 bg-card/80 p-6 transition hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <article className="space-y-2">
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
              <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {post.description}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary underline-offset-2 group-hover:underline">
                Lire l&apos;article →
              </span>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default BlogPreview;
