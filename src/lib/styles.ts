export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";
export const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60";
export const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50";
export const dangerBtn =
  "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50";
export const cardClass = "rounded-xl border border-stone-200 bg-white p-5 shadow-sm";
export const pageTitle = "text-2xl font-semibold tracking-tight text-stone-900";
export const chipClass = "inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600";

const badges = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  stone: "bg-stone-100 text-stone-600 ring-stone-200",
  teal: "bg-teal-50 text-teal-800 ring-teal-200",
  red: "bg-red-50 text-red-800 ring-red-200",
};
export const badgeClass = (kind: keyof typeof badges) =>
  `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badges[kind]}`;
