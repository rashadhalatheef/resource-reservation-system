// Runs automatically before `npm run dev`. Creates the PostgreSQL database if it does not exist yet,
// and gives clear messages for the two most common first-run problems (wrong password / server not running).
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function loadEnv() {
  const file = join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

async function main() {
  loadEnv();
  const raw = process.env.DATABASE_URL;
  if (!raw) fail("DATABASE_URL is missing. Open the .env file and set it.");
  if (raw.includes("YOUR_PASSWORD")) {
    fail("Open the .env file, replace YOUR_PASSWORD with your PostgreSQL password, save, and run npm run dev again.");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL in .env is not a valid URL. If your password contains symbols like @ or #, they must be URL-encoded (@ becomes %40, # becomes %23).");
  }
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z0-9_]+$/.test(dbName)) fail("The database name in DATABASE_URL may only contain letters, numbers and underscores.");

  // Connect to the built-in "postgres" database to check for ours
  const adminUrl = new URL(raw);
  adminUrl.pathname = "/postgres";
  const prisma = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const rows = await prisma.$queryRawUnsafe<{ present: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${dbName}') AS present`
    );
    if (!rows[0]?.present) {
      await prisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database "${dbName}".`);
    }
  } catch (e) {
    const msg = String(e);
    if (/password authentication failed|P1000/i.test(msg)) {
      fail("PostgreSQL rejected the password in .env. Check the password you chose when installing PostgreSQL.");
    }
    if (/ECONNREFUSED|P1001|Can't reach database server/i.test(msg)) {
      fail("Cannot reach PostgreSQL. Make sure it is installed and running on this computer (port 5432).");
    }
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main();
