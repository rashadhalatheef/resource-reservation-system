"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active ? "bg-teal-50 font-medium text-teal-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
