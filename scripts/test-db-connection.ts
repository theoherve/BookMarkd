import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

async function testConnection() {
  console.log("Testing database connection...");
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.BOOK_MARKD_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.BOOK_MARKD_SUPABASE_SERVICE_ROLE_KEY;
  console.log("Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Not set");
  console.log("Service Role Key:", serviceKey ? "✅ Set" : "❌ Not set");

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing Supabase config. Check .env.local.");
    process.exit(1);
  }

  try {
    const supabase = createSupabaseServiceClient();
    console.log("✅ Supabase client initialized");

    // Test a simple query
    const { count: userCount, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });
    if (countError) {
      throw countError;
    }
    console.log(`✅ Database is accessible. Found ${userCount ?? 0} user(s).`);

    // Test a second table
    const { count: booksCount, error: booksErr } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true });
    if (booksErr) throw booksErr;
    console.log(
      `✅ Books table accessible. Found ${booksCount ?? 0} book(s).`,
    );
  } catch (error) {
    console.error("❌ Failed to connect to database");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("\n🔍 Troubleshooting:");
      console.error("1. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
      console.error("2. Verify keys correspond to your project.");
      console.error("3. Check RLS policies if queries fail.");
      console.error("4. Confirm project is active (not paused).");
    }
    process.exit(1);
  }
}

testConnection();
