import { prisma } from "./prisma";
import { minutesOfDay } from "./time";

export const MAX_HOURS = 12;
export const MAX_OCCURRENCES = 12;

// Two ranges overlap when each starts before the other ends.
// Touching ends (10:00 / 10:00) do not conflict.
export function findConflict(resourceId: string, start: Date, end: Date, excludeId?: string) {
  return prisma.reservation.findFirst({
    where: {
      resourceId,
      status: "CONFIRMED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startTime: { lt: end },
      endTime: { gt: start },
    },
    include: { user: true },
  });
}

// Suggest the next free slots of the same length, between 06:00 and 22:00 Sri Lanka time.
export async function nextFreeSlots(resourceId: string, from: Date, durationMs: number, excludeId?: string, count = 3) {
  const windowEnd = new Date(from.getTime() + 14 * 86_400_000);
  const bookings = await prisma.reservation.findMany({
    where: {
      resourceId,
      status: "CONFIRMED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
      endTime: { gt: from },
      startTime: { lt: windowEnd },
    },
    orderBy: { startTime: "asc" },
  });

  const durMin = durationMs / 60_000;
  const slots: { start: Date; end: Date }[] = [];
  let cand = from.getTime();
  for (let guard = 0; slots.length < count && guard < 500; guard++) {
    const m = minutesOfDay(new Date(cand));
    if (m < 360) { cand += (360 - m) * 60_000; continue; }
    if (m + durMin > 1320) { cand += (1440 - m + 360) * 60_000; continue; }
    const clash = bookings.find((b) => b.startTime.getTime() < cand + durationMs && b.endTime.getTime() > cand);
    if (clash) { cand = clash.endTime.getTime(); continue; }
    slots.push({ start: new Date(cand), end: new Date(cand + durationMs) });
    cand += durationMs;
  }
  return slots;
}
