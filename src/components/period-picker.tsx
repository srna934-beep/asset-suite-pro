import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { PERIODS, rangeFor, type PeriodKey, type Range } from "@/lib/period";

const KEY = "dash-period";

/** حالة الفترة الزمنية المشتركة (تُحفظ محلياً لكل مستخدم). */
export function usePeriod(defaultKey: PeriodKey = "month") {
  const [key, setKey] = useState<PeriodKey>(defaultKey);
  const [custom, setCustom] = useState<Partial<Range>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { key: PeriodKey; custom?: Partial<Range> };
      if (p?.key) setKey(p.key);
      if (p?.custom) setCustom(p.custom);
    } catch { /* ignore */ }
  }, []);

  function update(k: PeriodKey, c?: Partial<Range>) {
    setKey(k);
    if (c) setCustom(c);
    localStorage.setItem(KEY, JSON.stringify({ key: k, custom: c ?? custom }));
  }

  return { key, custom, update, range: rangeFor(key, custom) };
}

export function PeriodPicker({
  value, custom, onChange,
}: {
  value: PeriodKey;
  custom: Partial<Range>;
  onChange: (k: PeriodKey, c?: Partial<Range>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
        <CalendarRange className="mx-1 h-4 w-4 shrink-0 text-muted-foreground" />
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
              value === p.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date" dir="ltr" value={custom.from ?? ""}
            onChange={(e) => onChange("custom", { ...custom, from: e.target.value })}
            className="h-9 rounded-lg border border-border bg-card px-2"
          />
          <span className="text-muted-foreground">إلى</span>
          <input
            type="date" dir="ltr" value={custom.to ?? ""}
            onChange={(e) => onChange("custom", { ...custom, to: e.target.value })}
            className="h-9 rounded-lg border border-border bg-card px-2"
          />
        </div>
      )}
    </div>
  );
}
