import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";

import { getAllPosts } from "@/lib/blog";
import type { BlogFeaturedCover, BlogPost } from "@/content/blog/posts";

const READING_WPM = 220;

const estimateReadingTime = (body: string): number => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_WPM));
};

const CoverStack = ({ covers }: { covers: BlogFeaturedCover[] }) => {
  const visible = covers.slice(0, 3);
  // Offsets: leftmost rotated back, center forward, rightmost rotated forward.
  const styles = [
    "rotate-[-8deg] -translate-x-6 translate-y-1 z-10",
    "z-30",
    "rotate-[8deg] translate-x-6 translate-y-1 z-20",
  ];
  // When only 2, push them closer.
  const pairStyles = ["rotate-[-6deg] -translate-x-3 z-20", "rotate-[6deg] translate-x-3 z-30"];
  const positions = visible.length === 2 ? pairStyles : styles;

  return (
    <div
      aria-hidden
      className="relative flex h-full w-full items-center justify-center bg-linear-to-br from-accent/20 via-secondary/40 to-muted"
    >
      <div className="relative flex items-center justify-center">
        {visible.map((cover, index) => (
          <div
            key={cover.id}
            className={`absolute aspect-2/3 w-20 overflow-hidden rounded-md bg-card shadow-lg ring-1 ring-border transition-transform duration-300 group-hover:scale-[1.04] ${positions[index] ?? ""}`}
          >
            <Image
              src={cover.coverUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const GradientFallback = ({ title }: { title: string }) => {
  const initial = title.trim()[0]?.toUpperCase() ?? "B";
  return (
    <div
      aria-hidden
      className="relative flex h-full w-full items-center justify-center bg-linear-to-br from-accent/30 via-secondary/60 to-muted"
    >
      <span className="text-5xl font-semibold text-foreground/10">
        {initial}
      </span>
      <BookOpen
        className="absolute size-7 text-accent-foreground/40"
        strokeWidth={1.5}
      />
    </div>
  );
};

const PostMedia = ({ post }: { post: BlogPost }) => {
  if (post.featuredCovers && post.featuredCovers.length > 0) {
    return <CoverStack covers={post.featuredCovers} />;
  }
  if (post.image) {
    return (
      <Image
        src={post.image}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
    );
  }
  return <GradientFallback title={post.title} />;
};

const BlogPreview = async () => {
  const posts = (await getAllPosts()).slice(0, 3);

  if (posts.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {posts.map((post) => {
        const readingTime = estimateReadingTime(post.body);
        return (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              aria-label={`Lire l'article : ${post.title}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <PostMedia post={post} />
              </div>
              <article className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <time
                    dateTime={post.publishedAt.toISOString()}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Calendar className="size-3" aria-hidden />
                    {post.publishedAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <span aria-hidden className="size-1 rounded-full bg-border" />
                  <span>{readingTime} min de lecture</span>
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {post.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                  Lire l&apos;article
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </article>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default BlogPreview;
