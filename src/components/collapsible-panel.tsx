import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** لوحة قابلة للطي مع تذكّر الحالة لكل مستخدم (بدون التأثير على غيره). */
export function CollapsiblePanel({
  id, title, icon, action, children, defaultOpen = true, className = "",
}: {
  id: string;
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const key = `panel-open:${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) setOpen(saved === "1");
  }, [key]);

  function toggle() {
    setOpen((o) => {
      localStorage.setItem(key, o ? "0" : "1");
      return !o;
    });
  }

  return (
    <section className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
        <button onClick={toggle} className="flex min-w-0 items-center gap-2 text-right">
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          {icon}
          <h3 className="truncate text-sm font-extrabold">{title}</h3>
        </button>
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      </div>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </section>
  );
}
