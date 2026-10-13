import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isDateStr } from "@/lib/time";
import ReservationForm from "@/components/ReservationForm";
import { createReservation } from "@/app/actions/reservations";
import { pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: { searchParams: Promise<{ resourceId?: string; date?: string }> }) {
  const user = await requireUser();
  const { resourceId, date } = await searchParams;
  const [resources, users] = await Promise.all([
    prisma.resource.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true } }),
    user.role === "ADMIN" ? prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve(undefined),
  ]);

  return (
    <div className="space-y-4">
      <h1 className={pageTitle}>New reservation</h1>
      <ReservationForm
        mode="create"
        action={createReservation}
        resources={resources}
        users={users}
        currentUserId={user.id}
        defaults={{ resourceId, date: isDateStr(date) ? date : undefined }}
      />
    </div>
  );
}
