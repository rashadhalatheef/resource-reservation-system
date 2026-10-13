import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cancelReservation, cancelSeries } from "@/app/actions/reservations";
import ConfirmForm from "@/components/ConfirmForm";
import { fmtDateTime, fmtTime } from "@/lib/time";
import { badgeClass, dangerBtn, pageTitle, primaryBtn, secondaryBtn } from "@/lib/styles";

export const dynamic = "force-dynamic";

const views = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const { view: rawView } = await searchParams;
  const view = views.some((v) => v.key === rawView) ? rawView! : "upcoming";
  const now = new Date();

  const where =
    view === "upcoming" ? { status: "CONFIRMED" as const, endTime: { gt: now } }
    : view === "past" ? { status: "CONFIRMED" as const, endTime: { lte: now } }
    : { status: "CANCELLED" as const };

  const reservations = await prisma.reservation.findMany({
    where: { ...where, ...(admin ? {} : { userId: user.id }) },
    orderBy: { startTime: view === "upcoming" ? "asc" : "desc" },
    take: 200,
    include: { resource: true, user: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={pageTitle}>{admin ? "Reservations" : "My reservations"}</h1>
        <div className="flex gap-2">
          {admin && <a href="/reservations/export" className={secondaryBtn}>Export CSV</a>}
          <Link href="/reservations/new" className={primaryBtn}>New reservation</Link>
        </div>
      </div>

      <div className="flex gap-5 border-b border-stone-200 text-sm">
        {views.map((v) => (
          <Link
            key={v.key}
            href={`/reservations?view=${v.key}`}
            className={`-mb-px border-b-2 pb-2 ${view === v.key ? "border-teal-700 font-medium text-teal-800" : "border-transparent text-stone-600 hover:text-stone-900"}`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-stone-600">No {view} reservations.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Resource</th>
                <th className="px-4 py-2.5 font-medium">When</th>
                {admin && <th className="px-4 py-2.5 font-medium">Booked by</th>}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-medium">
                    {r.title} {r.seriesId && <span className={badgeClass("teal")}>Repeats</span>}
                  </td>
                  <td className="px-4 py-2.5"><Link href={`/resources/${r.resourceId}`} className="hover:underline">{r.resource.name}</Link></td>
                  <td className="px-4 py-2.5 text-stone-700">{fmtDateTime(r.startTime)} to {fmtTime(r.endTime)}</td>
                  {admin && <td className="px-4 py-2.5">{r.user.name}</td>}
                  <td className="px-4 py-2.5">
                    {view === "upcoming" && (
                      <div className="flex justify-end gap-2">
                        <Link href={`/reservations/${r.id}/edit`} className={secondaryBtn}>Edit</Link>
                        <ConfirmForm action={cancelReservation.bind(null, r.id)} message="Cancel this reservation?">
                          <button className={dangerBtn}>Cancel</button>
                        </ConfirmForm>
                        {r.seriesId && (
                          <ConfirmForm action={cancelSeries.bind(null, r.seriesId)} message="Cancel all upcoming reservations in this series?">
                            <button className={dangerBtn}>Cancel series</button>
                          </ConfirmForm>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
