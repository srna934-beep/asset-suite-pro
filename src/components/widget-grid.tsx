import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GripVertical, RotateCcw } from "lucide-react";

export type Widget = {
  /** معرّف ثابت للودجت (يُستخدم لحفظ الترتيب). */
  id: string;
  /** وحدة الصلاحيات المرتبطة بالودجت (اختياري). */
  module?: string;
  node: ReactNode;
};

/**
 * شبكة ودجات قابلة لإعادة الترتيب بالسحب والإفلات،
 * مع حفظ ترتيب كل مستخدم محلياً وزر لإعادة الترتيب الافتراضي.
 */
export function WidgetGrid({
  storageKey,
  widgets,
  className = "grid gap-4 lg:grid-cols-3",
}: {
  storageKey: string;
  widgets: Widget[];
  className?: string;
}) {
  const key = `widget-order:${storageKey}`;
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setOrder(JSON.parse(saved) as string[]);
    } catch {
      /* ترتيب محفوظ غير صالح — نتجاهله */
    }
  }, [key]);

  const ordered = useMemo(() => {
    if (!order) return widgets;
    const map = new Map(widgets.map((w) => [w.id, w]));
    const out: Widget[] = [];
    for (const id of order) {
      const w = map.get(id);
      if (w) { out.push(w); map.delete(id); }
    }
    return [...out, ...map.values()];
  }, [order, widgets]);

  function persist(ids: string[]) {
    setOrder(ids);
    localStorage.setItem(key, JSON.stringify(ids));
  }

  function drop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ids = ordered.map((w) => w.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    persist(ids);
    setDragId(null);
    setOverId(null);
  }

  function reset() {
    localStorage.removeItem(key);
    setOrder(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">اسحب المقبض لإعادة ترتيب اللوحات — يُحفظ الترتيب لك وحدك</p>
        {order && (
          <button onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
            <RotateCcw className="h-3 w-3" /> الترتيب الافتراضي
          </button>
        )}
      </div>
      <div className={className}>
        {ordered.map((w) => (
          <div
            key={w.id}
            onDragOver={(e) => { e.preventDefault(); setOverId(w.id); }}
            onDragLeave={() => setOverId((o) => (o === w.id ? null : o))}
            onDrop={() => drop(w.id)}
            className={`relative transition ${dragId === w.id ? "opacity-50" : ""} ${overId === w.id && dragId !== w.id ? "ring-2 ring-primary rounded-2xl" : ""}`}
          >
            <button
              draggable
              onDragStart={() => setDragId(w.id)}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              aria-label="إعادة ترتيب اللوحة"
              className="absolute left-2 top-3 z-10 grid h-7 w-7 cursor-grab place-items-center rounded-lg text-muted-foreground hover:bg-accent active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {w.node}
          </div>
        ))}
      </div>
    </div>
  );
}
