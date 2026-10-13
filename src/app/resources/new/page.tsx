import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ResourceForm from "@/components/ResourceForm";
import { createResource } from "@/app/actions/resources";
import { pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  await requireAdmin();
  const types = await prisma.resourceType.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className={pageTitle}>Add resource</h1>
      <ResourceForm action={createResource} types={types} submitLabel="Add resource" />
    </div>
  );
}
