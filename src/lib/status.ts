import { prisma } from "./prisma";

// Map of resourceId -> the reservation happening right now (if any)
export async function currentBookings() {
  const now = new Date();
  const rows = await prisma.reservation.findMany({
    where: { status: "CONFIRMED", startTime: { lte: now }, endTime: { gt: now } },
    include: { user: true },
  });
  return new Map(rows.map((r) => [r.resourceId, r]));
}
