"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { reservationSchema, fieldErrorsFrom, valuesFrom, type FormState } from "@/lib/validation";
import { parseLocalInput, fmtDateTime, fmtTime } from "@/lib/time";
import { findConflict, nextFreeSlots, MAX_HOURS, MAX_OCCURRENCES } from "@/lib/booking";

type Conflict = NonNullable<Awaited<ReturnType<typeof findConflict>>>;

const enc = encodeURIComponent;

function refresh(resourceId: string) {
  for (const p of ["/", "/reservations", "/calendar", `/resources/${resourceId}`]) revalidatePath(p);
}

async function conflictMessage(c: Conflict, resourceId: string, start: Date, end: Date, excludeId?: string) {
  const slots = await nextFreeSlots(resourceId, start, end.getTime() - start.getTime(), excludeId);
  const tips = slots.length
    ? ` Next free slots: ${slots.map((s) => `${fmtDateTime(s.start)} to ${fmtTime(s.end)}`).join("; ")}.`
    : "";
  return `Already booked from ${fmtDateTime(c.startTime)} to ${fmtTime(c.endTime)} by ${c.user.name}.${tips}`;
}

function checkTimes(
  startRaw: string,
  endRaw: string,
  allowPast = false
): { fieldErrors: Record<string, string> } | { start: Date; end: Date } {
  const start = parseLocalInput(startRaw);
  const end = parseLocalInput(endRaw);
  if (!start) return { fieldErrors: { startTime: "Enter a valid start time" } };
  if (!end) return { fieldErrors: { endTime: "Enter a valid end time" } };
  if (end <= start) return { fieldErrors: { endTime: "End time must be after the start time" } };
  if (!allowPast && start.getTime() < Date.now() - 60_000) return { fieldErrors: { startTime: "Start time is in the past" } };
  if (end.getTime() - start.getTime() > MAX_HOURS * 3_600_000)
    return { fieldErrors: { endTime: `A reservation can be at most ${MAX_HOURS} hours` } };
  return { start, end };
}

export async function createReservation(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = valuesFrom(formData);
  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  const { resourceId, title, startTime, endTime, repeat, repeatCount } = parsed.data;

  const t = checkTimes(startTime, endTime);
  if ("fieldErrors" in t) return { fieldErrors: t.fieldErrors, values };
  const { start, end } = t;

  let count = 1;
  if (repeat !== "none") {
    count = Number(repeatCount);
    if (!Number.isInteger(count) || count < 2 || count > MAX_OCCURRENCES)
      return { fieldErrors: { repeatCount: `Choose between 2 and ${MAX_OCCURRENCES} occurrences` }, values };
  }

  let ownerId = user.id;
  if (user.role === "ADMIN" && parsed.data.userId) {
    const u = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!u) return { fieldErrors: { userId: "Person not found" }, values };
    ownerId = u.id;
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return { fieldErrors: { resourceId: "Resource not found" }, values };
  if (!resource.isActive) return { fieldErrors: { resourceId: "This resource is not available for booking" }, values };

  const step = repeat === "daily" ? 86_400_000 : 604_800_000;
  const occurrences = Array.from({ length: count }, (_, i) => ({
    start: new Date(start.getTime() + i * step),
    end: new Date(end.getTime() + i * step),
  }));

  // All-or-nothing: if any date clashes, nothing is reserved.
  const clashes: { start: Date; end: Date; c: Conflict }[] = [];
  for (const o of occurrences) {
    const c = await findConflict(resourceId, o.start, o.end);
    if (c) clashes.push({ ...o, c });
  }
  if (clashes.length) {
    const first = clashes[0];
    if (count === 1) return { error: await conflictMessage(first.c, resourceId, start, end), values };
    return {
      error: `${clashes.length} of ${count} dates clash, so nothing was reserved. First clash: ${fmtDateTime(first.start)}, booked by ${first.c.user.name}.`,
      values,
    };
  }

  const seriesId = count > 1 ? randomUUID() : null;
  try {
    // One database transaction: the whole series is created, or none of it is.
    await prisma.$transaction(
      occurrences.map((o) =>
        prisma.reservation.create({
          data: { resourceId, userId: ownerId, title, startTime: o.start, endTime: o.end, seriesId },
        })
      )
    );
  } catch (e) {
    // Someone may have booked between our check and the insert. The database exclusion
    // constraint stops it; we turn that into a normal message.
    for (const o of occurrences) {
      const c = await findConflict(resourceId, o.start, o.end);
      if (c) return { error: await conflictMessage(c, resourceId, o.start, o.end), values };
    }
    throw e;
  }

  await logActivity(
    user.id,
    count > 1 ? "RESERVATION_SERIES_CREATED" : "RESERVATION_CREATED",
    `"${title}" on ${resource.name}, ${fmtDateTime(start)}${count > 1 ? ` (${count} occurrences, ${repeat})` : ""}`
  );
  refresh(resourceId);
  redirect(`/reservations?notice=${enc(count > 1 ? `${count} reservations created.` : "Reservation confirmed.")}`);
}

export async function updateReservation(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing || (user.role !== "ADMIN" && existing.userId !== user.id))
    redirect(`/reservations?error=${enc("You can't edit that reservation.")}`);
  if (existing.status !== "CONFIRMED" || existing.endTime.getTime() < Date.now())
    redirect(`/reservations?error=${enc("Only upcoming reservations can be edited.")}`);

  const values = valuesFrom(formData);
  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  const { resourceId, title, startTime, endTime } = parsed.data;

  const t = checkTimes(startTime, endTime);
  if ("fieldErrors" in t) return { fieldErrors: t.fieldErrors, values };
  const { start, end } = t;

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || !resource.isActive) return { fieldErrors: { resourceId: "Choose an available resource" }, values };

  const clash = await findConflict(resourceId, start, end, id);
  if (clash) return { error: await conflictMessage(clash, resourceId, start, end, id), values };

  try {
    await prisma.reservation.update({ where: { id }, data: { resourceId, title, startTime: start, endTime: end } });
  } catch (e) {
    const raced = await findConflict(resourceId, start, end, id);
    if (raced) return { error: await conflictMessage(raced, resourceId, start, end, id), values };
    throw e;
  }

  await logActivity(user.id, "RESERVATION_UPDATED", `"${title}" on ${resource.name}, ${fmtDateTime(start)}`);
  refresh(resourceId);
  refresh(existing.resourceId);
  redirect(`/reservations?notice=${enc("Reservation updated.")}`);
}

export async function cancelReservation(id: string) {
  const user = await requireUser();
  const r = await prisma.reservation.findUnique({ where: { id }, include: { resource: true } });
  if (!r || (user.role !== "ADMIN" && r.userId !== user.id))
    redirect(`/reservations?error=${enc("You can't cancel that reservation.")}`);
  if (r.status === "CONFIRMED") {
    await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } });
    await logActivity(user.id, "RESERVATION_CANCELLED", `"${r.title}" on ${r.resource.name}, ${fmtDateTime(r.startTime)}`);
    refresh(r.resourceId);
  }
  redirect(`/reservations?notice=${enc("Reservation cancelled.")}`);
}

export async function cancelSeries(seriesId: string) {
  const user = await requireUser();
  const result = await prisma.reservation.updateMany({
    where: {
      seriesId,
      status: "CONFIRMED",
      startTime: { gt: new Date() },
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
    },
    data: { status: "CANCELLED" },
  });
  await logActivity(user.id, "RESERVATION_SERIES_CANCELLED", `${result.count} upcoming reservations cancelled`);
  for (const p of ["/", "/reservations", "/calendar"]) revalidatePath(p);
  redirect(`/reservations?notice=${enc(`${result.count} upcoming reservations cancelled.`)}`);
}
