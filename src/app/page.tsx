import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { currentBookings } from "@/lib/status";
import { dayRange, todayInTz, fmtDateTime, fmtTime, fmtDay, minutesOfDay, weekdayShort } from "@/lib/time";
import { badgeClass, cardClass, pageTitle, primaryBtn } from "@/lib/styles";

export const dynamic = "force-dynamic";

const DAY_HOURS = 16; // the bookable window shown on timelines, 06:00 to 22:00
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function Overview() {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const today = dayRange(todayInTz());
  const scope = admin ? {} : { userId: user.id };

  const [resources, current, todayCount, upcomingCount, upcoming, weekBookings, history] = await Promise.all([
    prisma.resource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    currentBookings(),
    prisma.reservation.count({ where: { status: "CONFIRMED", startTime: { lt: today.end }, endTime: { gt: today.start } } }),
    prisma.reservation.count({ where: { status: "CONFIRMED", endTime: { gt: now }, ...scope } }),
    prisma.reservation.findMany({
      where: { status: "CONFIRMED", endTime: { gt: now }, ...scope },
      orderBy: { startTime: "asc" },
      take: 5,
      include: { resource: true, user: true },
    }),
    prisma.reservation.findMany({ where: { status: "CONFIRMED", startTime: { lt: weekEnd }, endTime: { gt: now } } }),
    prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { gte: new Date(now.getTime() - 30 * 86_400_000), lt: new Date(now.getTime() + 30 * 86_400_000) },
      },
      select: { startTime: true },
    }),
  ]);

  const hours = new Map<string, number>();
  for (const b of weekBookings) {
    const s = Math.max(b.startTime.getTime(), now.getTime());
    const e = Math.min(b.endTime.getTime(), weekEnd.getTime());
    hours.set(b.resourceId, (hours.get(b.resourceId) ?? 0) + (e - s) / 3_600_000);
  }
  const capacityHours = Math.max(1, resources.length * 7 * DAY_HOURS);
  const bookedHours = resources.reduce((sum, r) => sum + (hours.get(r.id) ?? 0), 0);
  const utilisation = Math.round((bookedHours / capacityHours) * 100);

  const perDay = new Map<string, number>();
  for (const h of history) perDay.set(weekdayShort(h.startTime), (perDay.get(weekdayShort(h.startTime)) ?? 0) + 1);
  const maxDay = Math.max(1, ...WEEKDAYS.map((d) => perDay.get(d) ?? 0));

  const freeNow = resources.filter((r) => !current.has(r.id)).length;
  const hr = minutesOfDay(now) / 60;
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  const kpis = [
    { label: "Active resources", value: resources.length, sub: `${freeNow} free right now` },
    { label: "Booked today", value: todayCount, sub: "reservations" },
    { label: admin ? "Upcoming reservations" : "Your upcoming", value: upcomingCount, sub: admin ? "across everyone" : "reservations" },
    { label: "Utilisation, next 7 days", value: `${utilisation}%`, sub: `${bookedHours.toFixed(0)} h booked` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={pageTitle}>{greeting}, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-stone-600">{fmtDay(todayInTz())}</p>
        </div>
        <Link href="/reservations/new" className={primaryBtn}>New reservation</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cardClass}>
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{k.value}</p>
            <p className="text-xs text-stone-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Right now</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-stone-600">No active resources yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((r) => {
              const c = current.get(r.id);
              return (
                <Link key={r.id} href={`/resources/${r.id}`} className={`${cardClass} block transition hover:border-teal-300`}>
                  <p className="font-medium">{r.name}</p>
                  <div className="mt-2">
                    {c ? <span className={badgeClass("amber")}>In use until {fmtTime(c.endTime)}</span> : <span className={badgeClass("green")}>Free now</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">{admin ? "Next reservations" : "Your next reservations"}</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-stone-600">
              Nothing booked yet. <Link href="/reservations/new" className="text-teal-700 underline">Make a reservation</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
              {upcoming.map((r) => (
                <li key={r.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-stone-500">{r.resource.name}</span>
                  </div>
                  <p className="text-stone-600">{fmtDateTime(r.startTime)}{admin ? `, ${r.user.name}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Busiest days</h2>
          <div className={cardClass}>
            <div className="flex h-32 items-end gap-2">
              {WEEKDAYS.map((d) => {
                const n = perDay.get(d) ?? 0;
                return (
                  <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs text-stone-500">{n}</span>
                    <div className="w-full rounded-t bg-teal-600" style={{ height: `${(n / maxDay) * 80}%`, minHeight: n ? 4 : 0 }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 border-t border-stone-100 pt-2">
              {WEEKDAYS.map((d) => <span key={d} className="flex-1 text-center text-xs text-stone-500">{d}</span>)}
            </div>
            <p className="mt-3 text-xs text-stone-500">Reservations by weekday, 30 days back and ahead.</p>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Utilisation by resource, next 7 days</h2>
        <ul className="space-y-3">
          {resources.map((r) => {
            const h = hours.get(r.id) ?? 0;
            const p = Math.min(100, (h / (7 * DAY_HOURS)) * 100);
            return (
              <li key={r.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <Link href={`/resources/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                  <span className="text-stone-600">{h.toFixed(1)} h, {Math.round(p)}%</span>
                </div>
                <div className="h-2 rounded-full bg-stone-200"><div className="h-2 rounded-full bg-teal-600" style={{ width: `${p}%` }} /></div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
