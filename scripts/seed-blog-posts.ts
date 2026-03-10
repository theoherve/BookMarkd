import { createSupabaseServiceClient } from "../src/lib/supabase/service-client";

// Import all hardcoded blog posts
import { getAllPosts } from "../src/content/blog/posts";

const seedBlogPosts = async () => {
  const supabase = createSupabaseServiceClient();
  const posts = getAllPosts();

  console.log(`[seed-blog] Found ${posts.length} posts to seed...`);

  let inserted = 0;
  let skipped = 0;

  for (const post of posts) {
    // Check if slug already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", post.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  [skip] ${post.slug} (already exists)`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("blog_posts").insert({
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      image_url: post.image ?? null,
      status: "published",
      published_at: post.publishedAt.toISOString(),
      created_at: post.publishedAt.toISOString(),
      updated_at: (post.updatedAt ?? post.publishedAt).toISOString(),
    });

    if (error) {
      console.error(`  [error] ${post.slug}:`, error.message);
    } else {
      console.log(`  [ok] ${post.slug}`);
      inserted++;
    }
  }

  console.log(`\n[seed-blog] Done: ${inserted} inserted, ${skipped} skipped.`);
};

seedBlogPosts().catch((err) => {
  console.error("[seed-blog] Fatal error:", err);
  process.exit(1);
});
