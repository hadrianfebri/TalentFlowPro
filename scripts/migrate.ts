import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../server/db.js";

async function runMigration() {
  console.log("🚀 Starting database migration...");
  
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log("🎉 Migration process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration process failed:", error);
    process.exit(1);
  });