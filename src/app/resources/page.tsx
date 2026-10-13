import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { currentBookings } from "@/lib/status";
import { fmtTime } from "@/lib/time";
import { toggleResourceActive } from "@/app/actions/resources";
import { badgeClass, cardClass, chipClass, inputClass, pageTitle, primaryBtn, secondaryBtn } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; type?: string; cap?: string; free?: string }> }) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const { q, type, cap, free } = await searchParams;

  const where: Prisma.ResourceWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (type) where.resourceTypeId = type;
  if (cap && /^\d+$/.test(cap)) where.capacity = { gte: Number(cap) };
  if (!admin) where.isActive = true;

  const [resources, types, current] = await Promise.all([
    prisma.resource.findMany({ where, orderBy: [{ isActive: "desc" }, { name: "asc" }], include: { resourceType: true } }),
    prisma.resourceType.findMany({ orderBy: { name: "asc" } }),
    currentBookings(),
  ]);
  const shown = free ? resources.filter((r) => r.isActive && !current.has(r.id)) : resources;
  const filtered = !!(q || type || cap || free);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className={pageTitle}>Resources</h1>
        {admin && <Link href="/resources/new" className={primaryBtn}>Add resource</Link>}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm"><span className="mb-1 block text-stone-600">Search</span>
          <input name="q" defaultValue={q ?? ""} placeholder="Name" className={`${inputClass} w-44`} /></label>
        <label className="text-sm"><span className="mb-1 block text-stone-600">Type</span>
          <select name="type" defaultValue={type ?? ""} className={`${inputClass} w-40`}>
            <option value="">All types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>
        <label className="text-sm"><span className="mb-1 block text-stone-600">Min. capacity</span>
          <input name="cap" inputMode="numeric" defaultValue={cap ?? ""} className={`${inputClass} w-28`} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-stone-700">
          <input type="checkbox" name="free" value="1" defaultChecked={!!free} /> Free right now</label>
        <button className={secondaryBtn}>Filter</button>
        {filtered && <Link href="/resources" className="pb-2 text-sm text-teal-700 hover:underline">Clear</Link>}
      </form>

      {shown.length === 0 ? (
        <p className="text-sm text-stone-600">{filtered ? "No resources match those filters." : "No resources yet."}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => {
            const c = current.get(r.id);
            const amenities = r.amenities ? r.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [];
            return (
              <div key={r.id} className={`${cardClass} flex flex-col ${r.isActive ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/resources/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>
                  {!r.isActive ? <span className={badgeClass("stone")}>Inactive</span>
                    : c ? <span className={badgeClass("amber")}>In use until {fmtTime(c.endTime)}</span>
                    : <span className={badgeClass("green")}>Free now</span>}
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {r.resourceType.name}{r.location ? `, ${r.location}` : ""}{r.capacity ? `, seats ${r.capacity}` : ""}
                </p>
                {amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">{amenities.map((a) => <span key={a} className={chipClass}>{a}</span>)}</div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {r.isActive && <Link href={`/reservations/new?resourceId=${r.id}`} className={primaryBtn}>Book</Link>}
                  <Link href={`/resources/${r.id}`} className={secondaryBtn}>Availability</Link>
                  {admin && (
                    <>
                      <Link href={`/resources/${r.id}/edit`} className={secondaryBtn}>Edit</Link>
                      <form action={toggleResourceActive.bind(null, r.id)}>
                        <button className={secondaryBtn}>{r.isActive ? "Deactivate" : "Activate"}</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
