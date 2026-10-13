import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime } from "@/lib/time";
import { badgeClass, pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireAdmin();
  const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: true } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className={pageTitle}>Activity</h1>
        <p className="mt-1 text-sm text-stone-600">The latest 100 actions, so you can see who changed what.</p>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-stone-600">Nothing has happened yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr><th className="px-4 py-2.5 font-medium">When</th><th className="px-4 py-2.5 font-medium">Who</th><th className="px-4 py-2.5 font-medium">Action</th><th className="px-4 py-2.5 font-medium">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone-600">{fmtDateTime(l.createdAt)}</td>
                  <td className="px-4 py-2.5">{l.user?.name ?? "Deleted user"}</td>
                  <td className="px-4 py-2.5"><span className={badgeClass(l.action.includes("CANCEL") ? "red" : "teal")}>{l.action.replaceAll("_", " ").toLowerCase()}</span></td>
                  <td className="px-4 py-2.5 text-stone-700">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
