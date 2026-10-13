"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";
import { registerSchema, fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  // One generic message so the form does not reveal which emails exist
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password.", values: { email } };
  }
  await createSession(user.id);
  redirect("/");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = valuesFrom(formData);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { fieldErrors: { email: "An account with this email already exists" }, values };
  }
  const user = await prisma.user.create({ data: { name, email, passwordHash: hashPassword(password) } });
  await logActivity(user.id, "REGISTERED", `${name} created an account`);
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
