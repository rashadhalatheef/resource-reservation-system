import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { dayRange, todayInTz, shiftDate, fmtDay, isDateStr } from "@/lib/time";
import { Timeline, TimelineScale } from "@/components/Timeline";
import { cardClass, pageTitle, primaryBtn, secondaryBtn } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const { date: raw } = await searchParams;
  const date = isDateStr(raw) ? raw : todayInTz();
  const { start, end } = dayRange(date);
  const isToday = date === todayInTz();

  const [resources, bookings] = await Promise.all([
    prisma.resource.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { resourceType: true } }),
    prisma.reservation.findMany({
      where: { status: "CONFIRMED", startTime: { lt: end }, endTime: { gt: start } },
      orderBy: { startTime: "asc" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={pageTitle}>Calendar</h1>
          <p className="mt-1 text-sm text-stone-600">{fmtDay(date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/calendar?date=${shiftDate(date, -1)}`} className={secondaryBtn}>Previous</Link>
          <Link href="/calendar" className={secondaryBtn}>Today</Link>
          <Link href={`/calendar?date=${shiftDate(date, 1)}`} className={secondaryBtn}>Next</Link>
          <form method="get" className="flex items-center gap-2">
            <input type="date" name="date" defaultValue={date} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" />
            <button className={secondaryBtn}>Go</button>
          </form>
        </div>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        <div className="min-w-[760px] space-y-2">
          <div className="flex gap-4">
            <div className="w-40 shrink-0" />
            <div className="flex-1"><TimelineScale /></div>
            <div className="w-16 shrink-0" />
          </div>
          {resources.length === 0 && <p className="text-sm text-stone-600">No active resources yet.</p>}
          {resources.map((r) => {
            const blocks = bookings
              .filter((b) => b.resourceId === r.id)
              .map((b) => ({
                id: b.id, title: b.title, start: b.startTime, end: b.endTime, who: b.user.name,
                mine: b.userId === user.id,
                editable: (admin || b.userId === user.id) && b.endTime.getTime() > Date.now(),
              }));
            return (
              <div key={r.id} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <Link href={`/resources/${r.id}`} className="block truncate text-sm font-medium hover:underline">{r.name}</Link>
                  <p className="truncate text-xs text-stone-500">{r.resourceType.name}</p>
                </div>
                <div className="flex-1"><Timeline blocks={blocks} dayStart={start} showNow={isToday} /></div>
                <Link href={`/reservations/new?resourceId=${r.id}&date=${date}`} className="inline-flex w-16 shrink-0 items-center justify-center rounded-lg bg-teal-700 px-2 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-teal-800">Book</Link>
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-teal-700" /> Your reservations</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-stone-300" /> Others</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-0.5 bg-red-500" /> Now</span>
        <span>Click one of your upcoming blocks to edit it. Times are Sri Lanka time.</span>
      </p>
    </div>
  );
}
