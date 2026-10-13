import Link from "next/link";
import NavLinks from "./NavLinks";
import { logout } from "@/app/actions/auth";
import { badgeClass, primaryBtn, secondaryBtn } from "@/lib/styles";

export default function Nav({ user }: { user: { name: string; role: string } }) {
  const admin = user.role === "ADMIN";
  const links = [
    { href: "/", label: "Overview" },
    { href: "/calendar", label: "Calendar" },
    { href: "/resources", label: "Resources" },
    { href: "/reservations", label: admin ? "Reservations" : "My reservations" },
    ...(admin ? [{ href: "/activity", label: "Activity" }] : []),
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold text-stone-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">R</span>
          Reservations
        </Link>
        <div className="flex flex-wrap items-center gap-1"><NavLinks links={links} /></div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/reservations/new" className={primaryBtn}>New reservation</Link>
          <span className="hidden text-sm text-stone-700 sm:inline">{user.name}</span>
          <span className={badgeClass(admin ? "teal" : "stone")}>{admin ? "Admin" : "Member"}</span>
          <form action={logout}><button className={secondaryBtn}>Sign out</button></form>
        </div>
      </nav>
    </header>
  );
}
