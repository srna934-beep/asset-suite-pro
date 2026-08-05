import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Loader2 } from "lucide-react";

type Source = {
  table: string;
  label: string;
  fields: string[];
  title: string;
  /** مسار التفاصيل إن وُجد، وإلا مسار القائمة. */
  detail?: string;
  list: string;
};

const SOURCES: Source[] = [
  { table: "properties", label: "عقار", fields: ["name", "location", "address"], title: "name", detail: "/properties", list: "/properties" },
  { table: "units", label: "وحدة", fields: ["unit_number", "notes"], title: "unit_number", detail: "/units", list: "/units" },
  { table: "lands", label: "أرض / مزرعة", fields: ["name", "city", "deed_number"], title: "name", detail: "/lands", list: "/lands" },
  { table: "vehicles", label: "مركبة / معدة", fields: ["name", "plate_number", "brand", "model"], title: "name", detail: "/vehicles", list: "/vehicles" },
  { table: "projects", label: "مشروع", fields: ["name", "code"], title: "name", detail: "/projects", list: "/projects" },
  { table: "employees", label: "موظف", fields: ["full_name", "phone", "national_id"], title: "full_name", detail: "/employees", list: "/employees" },
  { table: "tenants", label: "مستأجر", fields: ["full_name", "phone", "national_id"], title: "full_name", list: "/tenants" },
  { table: "goals", label: "هدف", fields: ["name"], title: "name", detail: "/goals", list: "/goals" },
  { table: "budgets", label: "ميزانية", fields: ["name"], title: "name", detail: "/budgets", list: "/budgets" },
  { table: "documents", label: "وثيقة", fields: ["title", "category"], title: "title", list: "/documents" },
  { table: "tasks", label: "مهمة", fields: ["title"], title: "title", list: "/tasks" },
  { table: "maintenance_requests", label: "صيانة", fields: ["title", "assigned_to"], title: "title", list: "/maintenance" },
  { table: "transactions", label: "حركة مالية", fields: ["description", "category"], title: "description", list: "/transactions" },
  { table: "accounts", label: "حساب", fields: ["name", "bank_name", "account_number"], title: "name", list: "/accounts" },
];

type Hit = { id: string; label: string; title: string; to: string; sub?: string };

async function runSearch(q: string): Promise<Hit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      const or = s.fields.map((f) => `${f}.ilike.%${term}%`).join(",");
      const { data } = await (supabase as any).from(s.table).select("*").or(or).limit(5);
      return ((data ?? []) as any[]).map<Hit>((row) => ({
        id: `${s.table}:${row.id}`,
        label: s.label,
        title: String(row[s.title] ?? "—"),
        sub: row.status ?? row.city ?? row.category ?? undefined,
        to: s.detail ? `${s.detail}/${row.id}` : s.list,
      }));
    }),
  );
  return results.flat();
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") setQ(detail);
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("global-search", onOpen as EventListener);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("global-search", onOpen as EventListener);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => runSearch(q),
    enabled: open && q.trim().length >= 2,
    staleTime: 10_000,
  });

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    for (const h of hits) (g[h.label] ??= []).push(h);
    return Object.entries(g);
  }, [hits]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في كل النظام: عقارات، وحدات، أراضٍ، مركبات، مشاريع، موظفين، عقود، وثائق..."
            className="h-9 w-full bg-transparent text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.trim().length < 2 && (
            <p className="p-6 text-center text-xs text-muted-foreground">اكتب حرفين على الأقل للبحث — أو استخدم Ctrl + K في أي صفحة.</p>
          )}
          {isFetching && (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> جارٍ البحث...
            </div>
          )}
          {!isFetching && q.trim().length >= 2 && grouped.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">لا توجد نتائج مطابقة</p>
          )}
          {grouped.map(([label, rows]) => (
            <div key={label} className="mb-2">
              <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground">{label}</div>
              <ul>
                {rows.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => { setOpen(false); navigate({ to: h.to }); }}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-muted"
                    >
                      <span className="truncate text-sm font-semibold">{h.title}</span>
                      {h.sub && <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{h.sub}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
