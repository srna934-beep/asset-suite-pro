/** فلاتر الفترات الزمنية الموحّدة لكل إحصائيات النظام. */

export type PeriodKey =
  | "today" | "yesterday" | "week" | "lastWeek"
  | "month" | "lastMonth" | "quarter" | "year" | "all" | "custom";

export type Range = { from: string; to: string };

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "lastWeek", label: "الأسبوع الماضي" },
  { key: "month", label: "هذا الشهر" },
  { key: "lastMonth", label: "الشهر الماضي" },
  { key: "quarter", label: "الربع" },
  { key: "year", label: "السنة" },
  { key: "all", label: "الكل" },
  { key: "custom", label: "مدى مخصص" },
];

export function periodLabel(key: PeriodKey) {
  return PERIODS.find((p) => p.key === key)?.label ?? "الشهر";
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** بداية الأسبوع = السبت (التقويم المحلي). */
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=الأحد ... 6=السبت
  const back = (day + 1) % 7;
  return addDays(d, -back);
}

export function rangeFor(key: PeriodKey, custom?: Partial<Range>): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "today": return { from: iso(now), to: iso(now) };
    case "yesterday": {
      const d = addDays(now, -1);
      return { from: iso(d), to: iso(d) };
    }
    case "week": {
      const s = startOfWeek(now);
      return { from: iso(s), to: iso(addDays(s, 6)) };
    }
    case "lastWeek": {
      const s = addDays(startOfWeek(now), -7);
      return { from: iso(s), to: iso(addDays(s, 6)) };
    }
    case "month": return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case "lastMonth": return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) };
    }
    case "year": return { from: iso(new Date(y, 0, 1)), to: iso(new Date(y, 11, 31)) };
    case "all": return { from: "0000-01-01", to: "9999-12-31" };
    case "custom":
      return { from: custom?.from || iso(new Date(y, m, 1)), to: custom?.to || iso(now) };
  }
}

/** الفترة السابقة المماثلة (بنفس عدد الأيام) لأغراض المقارنة. */
export function previousRange(r: Range): Range {
  if (r.from === "0000-01-01") return r;
  const from = new Date(r.from);
  const to = new Date(r.to);
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
  return { from: iso(addDays(from, -days)), to: iso(addDays(to, -days)) };
}

export function inRange(date: string | null | undefined, r: Range) {
  if (!date) return false;
  const d = String(date).slice(0, 10);
  return d >= r.from && d <= r.to;
}

/** نسبة التغيّر مقابل الفترة السابقة. */
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current ? 100 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function fmtPct(v: number | null) {
  if (v === null) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}
