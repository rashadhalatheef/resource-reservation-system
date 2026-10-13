import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLocalInput } from "@/lib/time";

export const dynamic = "force-dynamic";

// Values starting with = + - @ can be run as formulas by spreadsheets, so we neutralise them
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const rows = await prisma.reservation.findMany({
    orderBy: { startTime: "desc" },
    take: 5000,
    include: { resource: true, user: true },
  });
  const header = ["Title", "Resource", "Booked by", "Start (Sri Lanka time)", "End (Sri Lanka time)", "Status"];
  const lines = rows.map((r) =>
    [r.title, r.resource.name, r.user.name, toLocalInput(r.startTime).replace("T", " "), toLocalInput(r.endTime).replace("T", " "), r.status]
      .map(cell)
      .join(",")
  );
  const body = [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response("\uFEFF" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reservations.csv"',
    },
  });
}
