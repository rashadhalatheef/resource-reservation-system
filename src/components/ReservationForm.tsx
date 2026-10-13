"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { inputClass, secondaryBtn } from "@/lib/styles";
import type { FormState } from "@/lib/validation";

type Props = {
  mode: "create" | "edit";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  resources: { id: string; name: string; location: string | null }[];
  users?: { id: string; name: string }[];
  currentUserId?: string;
  initial?: { resourceId: string; title: string; startTime: string; endTime: string };
  defaults?: { resourceId?: string; date?: string };
};

export default function ReservationForm({ mode, action, resources, users, currentUserId, initial, defaults }: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const [repeat, setRepeat] = useState("none");
  const fe = state?.fieldErrors ?? {};
  const v = (k: string, fallback = "") => state?.values?.[k] ?? fallback;
  const d = defaults?.date;

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800">{state.error}</p>}

      <Field label="Resource" error={fe.resourceId}>
        <select name="resourceId" defaultValue={v("resourceId", initial?.resourceId ?? defaults?.resourceId ?? "")} className={inputClass}>
          <option value="">Choose a resource</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name}{r.location ? ` (${r.location})` : ""}</option>
          ))}
        </select>
      </Field>

      {mode === "create" && users && (
        <Field label="Booked for" error={fe.userId} hint="Administrators can book on behalf of someone else">
          <select name="userId" defaultValue={v("userId", currentUserId ?? "")} className={inputClass}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Title" error={fe.title} hint="For example, Sprint planning">
        <input name="title" defaultValue={v("title", initial?.title ?? "")} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Starts" error={fe.startTime}>
          <input type="datetime-local" name="startTime" defaultValue={v("startTime", initial?.startTime ?? (d ? `${d}T09:00` : ""))} className={inputClass} />
        </Field>
        <Field label="Ends" error={fe.endTime}>
          <input type="datetime-local" name="endTime" defaultValue={v("endTime", initial?.endTime ?? (d ? `${d}T10:00` : ""))} className={inputClass} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-stone-500">Times are in Sri Lanka time.</p>

      {mode === "create" && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Repeat">
              <select name="repeat" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={inputClass}>
                <option value="none">Does not repeat</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
              </select>
            </Field>
            {repeat !== "none" && (
              <Field label="Occurrences" error={fe.repeatCount} hint="2 to 12, including the first">
                <input name="repeatCount" inputMode="numeric" defaultValue={v("repeatCount", "4")} className={inputClass} />
              </Field>
            )}
          </div>
          {repeat !== "none" && (
            <p className="mt-3 text-xs text-stone-600">
              A repeating booking is all-or-nothing: if any date is already taken, none are created.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <SubmitButton label={mode === "create" ? "Reserve" : "Save changes"} />
        <Link href="/reservations" className={secondaryBtn}>Cancel</Link>
      </div>
    </form>
  );
}
