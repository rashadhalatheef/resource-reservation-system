"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { resourceSchema, fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation";

export async function createResource(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: valuesFrom(formData) };
  const r = await prisma.resource.create({ data: parsed.data });
  await logActivity(admin.id, "RESOURCE_CREATED", `Added resource "${r.name}"`);
  revalidatePath("/resources");
  redirect(`/resources?notice=${encodeURIComponent(`"${r.name}" was added.`)}`);
}

export async function updateResource(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: valuesFrom(formData) };
  const r = await prisma.resource.update({ where: { id }, data: parsed.data });
  await logActivity(admin.id, "RESOURCE_UPDATED", `Updated resource "${r.name}"`);
  revalidatePath("/resources");
  revalidatePath(`/resources/${id}`);
  redirect(`/resources?notice=${encodeURIComponent(`"${r.name}" was updated.`)}`);
}

export async function toggleResourceActive(id: string) {
  const admin = await requireAdmin();
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return;
  if (resource.isActive) {
    const upcoming = await prisma.reservation.count({
      where: { resourceId: id, status: "CONFIRMED", endTime: { gt: new Date() } },
    });
    if (upcoming > 0) {
      const msg = `Cannot deactivate "${resource.name}": it has ${upcoming} upcoming reservation(s). Cancel them first.`;
      redirect(`/resources?error=${encodeURIComponent(msg)}`);
    }
  }
  await prisma.resource.update({ where: { id }, data: { isActive: !resource.isActive } });
  await logActivity(admin.id, resource.isActive ? "RESOURCE_DEACTIVATED" : "RESOURCE_ACTIVATED", `"${resource.name}"`);
  revalidatePath("/resources");
  revalidatePath("/");
  redirect(`/resources?notice=${encodeURIComponent(`"${resource.name}" is now ${resource.isActive ? "inactive" : "active"}.`)}`);
}
