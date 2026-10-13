import Link from "next/link";
import { fmtTime } from "@/lib/time";

export type TimelineBlock = {
  id: string; title: string; start: Date; end: Date; who: string; mine: boolean; editable: boolean;
};

// The visible window is 06:00 to 22:00 (Sri Lanka time)
const WIN_START = 360;
const WIN_END = 1320;
const SPAN = WIN_END - WIN_START;
const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i);
const pct = (min: number) => ((min - WIN_START) / SPAN) * 100;

export function TimelineScale() {
  return (
    <div className="relative h-5 text-[11px] text-stone-500">
      {HOURS.filter((h) => h % 2 === 0).map((h) => (
        <span key={h} className="absolute -translate-x-1/2" style={{ left: `${pct(h * 60)}%` }}>
          {String(h).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

export function Timeline({ blocks, dayStart, showNow }: { blocks: TimelineBlock[]; dayStart: Date; showNow?: boolean }) {
  const nowPct = pct((Date.now() - dayStart.getTime()) / 60_000);
  return (
    <div className="relative h-11 overflow-hidden rounded-lg bg-stone-50 ring-1 ring-stone-200">
      {HOURS.slice(1, -1).map((h) => (
        <div key={h} className="absolute inset-y-0 w-px bg-stone-200/80" style={{ left: `${pct(h * 60)}%` }} />
      ))}
      {blocks.map((b) => {
        const s = Math.max((b.start.getTime() - dayStart.getTime()) / 60_000, WIN_START);
        const e = Math.min((b.end.getTime() - dayStart.getTime()) / 60_000, WIN_END);
        if (e <= s) return null;
        const width = ((e - s) / SPAN) * 100;
        const style = { left: `${pct(s)}%`, width: `${width}%` };
        const past = b.end.getTime() < Date.now();
        const cls = `absolute inset-y-1 overflow-hidden whitespace-nowrap rounded-md px-1.5 text-[11px] font-medium leading-8 ${
          b.mine ? "bg-teal-700 text-white" : "bg-stone-300 text-stone-800"
        } ${past ? "opacity-60" : ""}`;
        const tip = `${b.title} (${b.who}), ${fmtTime(b.start)} to ${fmtTime(b.end)}`;
        const label = width > 9 ? b.title : "";
        return b.editable ? (
          <Link key={b.id} href={`/reservations/${b.id}/edit`} title={tip} className={`${cls} hover:ring-2 hover:ring-teal-400`} style={style}>
            {label}
          </Link>
        ) : (
          <div key={b.id} title={tip} className={cls} style={style}>{label}</div>
        );
      })}
      {showNow && nowPct > 0 && nowPct < 100 && (
        <div className="absolute inset-y-0 w-0.5 bg-red-500" style={{ left: `${nowPct}%` }} />
      )}
    </div>
  );
}
