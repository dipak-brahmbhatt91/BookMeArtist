import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, "admin")).limit(1);
  if (existing.length > 0) {
    console.log("Admin user already exists");
    process.exit(0);
  }
  const passwordHash = await bcryptjs.hash("admin123", 12);
  await db.insert(usersTable).values({
    username: "admin",
    passwordHash,
    role: "admin",
    artistId: null,
  });
  console.log("✅ Admin user created: username=admin password=admin123");
}
seedAdmin().catch(console.error).finally(() => process.exit(0));
