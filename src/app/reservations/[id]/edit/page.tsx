import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toLocalInput } from "@/lib/time";
import ReservationForm from "@/components/ReservationForm";
import { updateReservation } from "@/app/actions/reservations";
import { pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function EditReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = await prisma.reservation.findUnique({ where: { id } });
  const back = (m: string) => `/reservations?error=${encodeURIComponent(m)}`;

  if (!r || (user.role !== "ADMIN" && r.userId !== user.id)) redirect(back("You can't edit that reservation."));
  if (r.status !== "CONFIRMED" || r.endTime.getTime() < Date.now()) redirect(back("Only upcoming reservations can be edited."));

  const resources = await prisma.resource.findMany({
    where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true },
  });

  return (
    <div className="space-y-4">
      <h1 className={pageTitle}>Edit reservation</h1>
      {r.seriesId && <p className="text-sm text-stone-600">This is part of a repeating series. Changes apply to this occurrence only.</p>}
      <ReservationForm
        mode="edit"
        action={updateReservation.bind(null, id)}
        resources={resources}
        initial={{ resourceId: r.resourceId, title: r.title, startTime: toLocalInput(r.startTime), endTime: toLocalInput(r.endTime) }}
      />
    </div>
  );
}
