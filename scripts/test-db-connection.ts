import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

async function testConnection() {
  console.log("Testing database connection...");
  const dbUrl = process.env.BOOK_MARKD_POSTGRES_URL_NON_POOLING;
  console.log("Database URL:", dbUrl ? "✅ Set" : "❌ Not set");

  if (dbUrl) {
    // Masquer le mot de passe pour l'affichage
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
    console.log("URL (masked):", maskedUrl);

    // Vérifier le type de connexion
    const isSessionPooler =
      dbUrl.includes("pooler.supabase.com") && dbUrl.includes(":6543");
    const isConnectionPooler =
      dbUrl.includes("pooler.supabase.com") && dbUrl.includes(":5432");

    if (isConnectionPooler) {
      console.error(
        "❌ ERROR: You're using Connection Pooler (port 5432) which doesn't work with Prisma."
      );
      console.error(
        "   Use Session Pooler (port 6543) instead:\n" +
          "   Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
      );
    } else if (isSessionPooler) {
      console.log(
        "✅ Using Session Pooler (port 6543) - compatible with Prisma"
      );
    }
  }

  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to database");

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database is accessible. Found ${userCount} user(s).`);

    // Test the new UserTopBook model
    try {
      const topBooksCount = await prisma.userTopBook.count();
      console.log(
        `✅ UserTopBook model is accessible. Found ${topBooksCount} top book(s).`
      );
    } catch (error) {
      console.error("❌ UserTopBook model error:", error);
      if (
        error instanceof Error &&
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.error(
          "⚠️  The user_top_books table doesn't exist yet. Run: pnpm prisma db push"
        );
      }
    }
  } catch (error) {
    console.error("❌ Failed to connect to database");
    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if (error.message.includes("Can't reach database server")) {
        console.error("\n🔍 Troubleshooting:");
        console.error(
          "1. Check that BOOK_MARKD_POSTGRES_URL_NON_POOLING is set in .env.local"
        );
        console.error(
          "2. Verify the URL format: postgresql://postgres:[password]@[host]:5432/postgres"
        );
        console.error(
          "3. Make sure you're using the DIRECT connection (port 5432), not the pooler"
        );
        console.error(
          "4. Check if your Supabase project is active (not paused)"
        );
        console.error("5. Verify network connectivity to Supabase");
      } else if (error.message.includes("authentication failed")) {
        console.error(
          "\n🔍 Authentication failed - check your password in the connection string"
        );
      } else if (error.message.includes("does not exist")) {
        console.error(
          "\n🔍 Database or schema doesn't exist - check your connection string"
        );
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
