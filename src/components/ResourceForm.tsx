"use client";
import { useActionState } from "react";
import Link from "next/link";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { inputClass, secondaryBtn } from "@/lib/styles";
import type { FormState } from "@/lib/validation";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  types: { id: string; name: string }[];
  initial?: Record<string, string>;
  submitLabel: string;
};

export default function ResourceForm({ action, types, initial, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const v = (k: string) => state?.values?.[k] ?? initial?.[k] ?? "";

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <Field label="Name" error={fe.name}>
        <input name="name" defaultValue={v("name")} className={inputClass} />
      </Field>
      <Field label="Type" error={fe.resourceTypeId}>
        <select name="resourceTypeId" defaultValue={v("resourceTypeId")} className={inputClass}>
          <option value="">Choose a type</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" error={fe.location} hint="Optional, for example Floor 2">
          <input name="location" defaultValue={v("location")} className={inputClass} />
        </Field>
        <Field label="Capacity" error={fe.capacity} hint="Optional, number of people">
          <input name="capacity" inputMode="numeric" defaultValue={v("capacity")} className={inputClass} />
        </Field>
      </div>
      <Field label="Amenities" error={fe.amenities} hint="Optional, comma separated: Projector, Whiteboard">
        <input name="amenities" defaultValue={v("amenities")} className={inputClass} />
      </Field>
      <Field label="Description" error={fe.description}>
        <textarea name="description" rows={3} defaultValue={v("description")} className={inputClass} />
      </Field>
      <div className="flex gap-3">
        <SubmitButton label={submitLabel} />
        <Link href="/resources" className={secondaryBtn}>Cancel</Link>
      </div>
    </form>
  );
}
