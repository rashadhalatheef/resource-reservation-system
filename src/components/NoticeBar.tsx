"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Shows ?notice=... (green) or ?error=... (red) as a banner that fades after a few seconds
export default function NoticeBar() {
  const sp = useSearchParams();
  const notice = sp.get("notice");
  const error = sp.get("error");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
    const t = setTimeout(() => setHidden(true), 8000);
    return () => clearTimeout(t);
  }, [notice, error]);

  const message = error ?? notice;
  if (!message || hidden) return null;
  return (
    <div
      role="status"
      className={`mb-4 flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${
        error ? "bg-red-50 text-red-800 ring-red-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
      }`}
    >
      <span>{message}</span>
      <button onClick={() => setHidden(true)} aria-label="Dismiss" className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
    </div>
  );
}
