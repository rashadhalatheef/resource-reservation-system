"use client";
import { useFormStatus } from "react-dom";
import { primaryBtn } from "@/lib/styles";

export default function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryBtn}>
      {pending ? "Saving..." : label}
    </button>
  );
}
