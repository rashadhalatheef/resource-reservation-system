import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";
import { cardClass, pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="mx-auto max-w-sm space-y-5 pt-8">
      <h1 className={pageTitle}>Create an account</h1>
      <div className={cardClass}><RegisterForm /></div>
    </div>
  );
}
