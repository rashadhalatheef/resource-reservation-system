"use client";
import { useActionState } from "react";
import Link from "next/link";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { inputClass } from "@/lib/styles";
import { login, register } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email ?? ""} className={inputClass} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" className={inputClass} />
      </Field>
      <SubmitButton label="Sign in" />
      <p className="text-sm text-stone-600">
        New here? <Link href="/register" className="font-medium text-teal-700 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(register, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <Field label="Full name" error={fe.name}>
        <input name="name" autoComplete="name" defaultValue={state?.values?.name ?? ""} className={inputClass} />
      </Field>
      <Field label="Email" error={fe.email}>
        <input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email ?? ""} className={inputClass} />
      </Field>
      <Field label="Password" error={fe.password} hint="At least 8 characters">
        <input name="password" type="password" autoComplete="new-password" className={inputClass} />
      </Field>
      <SubmitButton label="Create account" />
      <p className="text-sm text-stone-600">
        Already have an account? <Link href="/login" className="font-medium text-teal-700 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
