import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import Nav from "@/components/Nav";
import NoticeBar from "@/components/NoticeBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Resource Reservations",
  description: "Book shared rooms and equipment without double-booking.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {user ? (
          <Nav user={user} />
        ) : (
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
              <Link href="/login" className="flex items-center gap-2 font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">R</span>
                Reservations
              </Link>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Suspense fallback={null}><NoticeBar /></Suspense>
          {children}
        </main>
      </body>
    </html>
  );
}
