// All times are stored in UTC (timestamptz). The organisation works in Sri Lanka time,
// so form input is interpreted as, and displayed in, Asia/Colombo (UTC+05:30, no DST).
export const TZ = "Asia/Colombo";
const OFFSET = "+05:30";
const DAY = 86_400_000;

export function parseLocalInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Value for <input type="datetime-local"> in Sri Lanka time
export const toLocalInput = (d: Date) =>
  d.toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T").slice(0, 16);

export const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-GB", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const todayInTz = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const isDateStr = (s?: string): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00${OFFSET}`).getTime());

export function dayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00${OFFSET}`);
  return { start, end: new Date(start.getTime() + DAY) };
}

export const shiftDate = (dateStr: string, days: number) =>
  new Date(new Date(`${dateStr}T12:00:00${OFFSET}`).getTime() + days * DAY).toLocaleDateString("en-CA", { timeZone: TZ });

export const fmtDay = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00${OFFSET}`).toLocaleDateString("en-GB", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export const fmtDayShort = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00${OFFSET}`).toLocaleDateString("en-GB", {
    timeZone: TZ, weekday: "short", day: "numeric", month: "short",
  });

export function minutesOfDay(d: Date) {
  const [h, m] = d
    .toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .split(":")
    .map(Number);
  return h * 60 + m;
}

export const weekdayShort = (d: Date) => d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" });
