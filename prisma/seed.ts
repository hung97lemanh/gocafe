// Run with: npx tsx prisma/seed.ts
import dotenv from "dotenv";
import { prisma } from "../src/lib/prisma"; // Fixed: added ../

dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Please set ADMIN_EMAIL and ADMIN_PASSWORD in env before running seed.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }

  const hashedBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const hashed = Array.from(new Uint8Array(hashedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const user = await prisma.user.create({
    data: {
      email,
      name: "Admin",
      password: hashed,
    },
  });

  console.log("Created admin user:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });