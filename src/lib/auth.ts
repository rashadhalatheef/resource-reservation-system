import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

// Stateless signed-cookie session: the cookie holds {uid, exp} plus an HMAC signature,
// so it cannot be edited by the browser. httpOnly keeps it away from page scripts.
const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
  return "dev-only-secret-change-me";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export async function createSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

function readUserId(token?: string): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" && typeof exp === "number" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const uid = readUserId((await cookies()).get(COOKIE)?.value);
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid }, select: { id: true, name: true, email: true, role: true } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(`/?error=${encodeURIComponent("Only administrators can do that.")}`);
  return user;
}
