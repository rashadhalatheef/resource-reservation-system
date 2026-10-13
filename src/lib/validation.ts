import { z } from "zod";

export type FormState =
  | { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function valuesFrom(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION") && k !== "password") out[k] = v;
  });
  return out;
}

export const resourceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  resourceTypeId: z.string().min(1, "Choose a type"),
  description: z.string().trim().max(500, "Maximum 500 characters").optional().transform((v) => v || null),
  location: z.string().trim().max(100, "Maximum 100 characters").optional().transform((v) => v || null),
  amenities: z
    .string()
    .trim()
    .max(200, "Maximum 200 characters")
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean).join(", ") || null : null)),
  capacity: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 1), "Capacity must be a whole number, 1 or more")
    .transform((v) => (v ? Number(v) : null)),
});

export const reservationSchema = z.object({
  resourceId: z.string().min(1, "Choose a resource"),
  userId: z.string().optional(),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title is too long"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  repeat: z.enum(["none", "daily", "weekly"]).default("none"),
  repeatCount: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password is too long"),
});
