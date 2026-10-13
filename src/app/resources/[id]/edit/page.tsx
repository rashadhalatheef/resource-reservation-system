import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ResourceForm from "@/components/ResourceForm";
import { updateResource } from "@/app/actions/resources";
import { pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [resource, types] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.resourceType.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!resource) notFound();

  return (
    <div className="space-y-4">
      <h1 className={pageTitle}>Edit {resource.name}</h1>
      <ResourceForm
        action={updateResource.bind(null, id)}
        types={types}
        submitLabel="Save changes"
        initial={{
          name: resource.name,
          resourceTypeId: resource.resourceTypeId,
          description: resource.description ?? "",
          location: resource.location ?? "",
          capacity: resource.capacity?.toString() ?? "",
          amenities: resource.amenities ?? "",
        }}
      />
    </div>
  );
}
