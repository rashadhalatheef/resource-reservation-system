import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";
import { cardClass, pageTitle } from "@/lib/styles";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="mx-auto max-w-sm space-y-5 pt-8">
      <div>
        <h1 className={pageTitle}>Sign in</h1>
        <p className="mt-1 text-sm text-stone-600">Book rooms and equipment without clashes.</p>
      </div>
      <div className={cardClass}><LoginForm /></div>
      <div className="rounded-lg bg-teal-50 p-4 text-sm text-teal-900 ring-1 ring-inset ring-teal-200">
        <p className="mb-1 font-medium">Demo accounts</p>
        <p>Admin: admin@example.com / admin123</p>
        <p>Member: member@example.com / member123</p>
      </div>
    </div>
  );
}
