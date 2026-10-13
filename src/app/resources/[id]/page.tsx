import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { currentBookings } from "@/lib/status";
import { dayRange, todayInTz, shiftDate, fmtDayShort, fmtDateTime, fmtTime, isDateStr } from "@/lib/time";
import { Timeline, TimelineScale } from "@/components/Timeline";
import { badgeClass, cardClass, chipClass, pageTitle, primaryBtn, secondaryBtn } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function ResourceDetail({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const { id } = await params;
  const { from: raw } = await searchParams;
  const from = isDateStr(raw) ? raw : todayInTz();
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(from, i));
  const weekStart = dayRange(from).start;
  const weekEnd = dayRange(days[6]).end;

  const resource = await prisma.resource.findUnique({ where: { id }, include: { resourceType: true } });
  if (!resource || (!resource.isActive && !admin)) notFound();

  const [bookings, current] = await Promise.all([
    prisma.reservation.findMany({
      where: { resourceId: id, status: "CONFIRMED", startTime: { lt: weekEnd }, endTime: { gt: weekStart } },
      orderBy: { startTime: "asc" },
      include: { user: true },
    }),
    currentBookings(),
  ]);
  const c = current.get(id);
  const amenities = resource.amenities ? resource.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [];
  const today = todayInTz();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={pageTitle}>{resource.name}</h1>
            {!resource.isActive ? <span className={badgeClass("stone")}>Inactive</span>
              : c ? <span className={badgeClass("amber")}>In use until {fmtTime(c.endTime)}</span>
              : <span className={badgeClass("green")}>Free now</span>}
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {resource.resourceType.name}{resource.location ? `, ${resource.location}` : ""}{resource.capacity ? `, seats ${resource.capacity}` : ""}
          </p>
          {resource.description && <p className="mt-2 max-w-xl text-sm">{resource.description}</p>}
          {amenities.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{amenities.map((a) => <span key={a} className={chipClass}>{a}</span>)}</div>}
        </div>
        <div className="flex gap-2">
          {admin && <Link href={`/resources/${id}/edit`} className={secondaryBtn}>Edit</Link>}
          {resource.isActive && <Link href={`/reservations/new?resourceId=${id}`} className={primaryBtn}>Reserve</Link>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/resources/${id}?from=${shiftDate(from, -7)}`} className={secondaryBtn}>Previous week</Link>
        <Link href={`/resources/${id}`} className={secondaryBtn}>This week</Link>
        <Link href={`/resources/${id}?from=${shiftDate(from, 7)}`} className={secondaryBtn}>Next week</Link>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        <div className="min-w-[700px] space-y-2">
          <div className="flex gap-4"><div className="w-28 shrink-0" /><div className="flex-1"><TimelineScale /></div></div>
          {days.map((d) => {
            const { start, end } = dayRange(d);
            const blocks = bookings
              .filter((b) => b.startTime < end && b.endTime > start)
              .map((b) => ({
                id: b.id, title: b.title, start: b.startTime, end: b.endTime, who: b.user.name,
                mine: b.userId === user.id,
                editable: (admin || b.userId === user.id) && b.endTime.getTime() > Date.now(),
              }));
            return (
              <div key={d} className="flex items-center gap-4">
                <Link href={`/calendar?date=${d}`} className={`w-28 shrink-0 text-sm hover:underline ${d === today ? "font-semibold text-teal-800" : "text-stone-700"}`}>
                  {fmtDayShort(d)}
                </Link>
                <div className="flex-1"><Timeline blocks={blocks} dayStart={start} showNow={d === today} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Bookings in this week</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-stone-600">Free all week.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm shadow-sm">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                <span className="font-medium">{b.title}</span>
                <span className="text-stone-600">{fmtDateTime(b.startTime)} to {fmtTime(b.endTime)}, {b.user.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
