"use client";

// A form that asks "Are you sure?" before running a server action (used for cancel buttons)
export default function ConfirmForm({
  action, message, children,
}: { action: (formData: FormData) => void | Promise<void>; message: string; children: React.ReactNode }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </form>
  );
}
