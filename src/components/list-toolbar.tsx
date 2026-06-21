import { Search } from "lucide-react";
import { Input } from "./ui/input";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  filters?: { value: string; label?: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }[];
  sort?: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] };
  children?: React.ReactNode;
};

export function ListToolbar({ search, onSearch, filters, sort, children }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="ابحث..." className="pr-9" />
      </div>
      {filters?.map((f, i) => (
        <select key={i} value={f.value} onChange={(e) => f.onChange(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{f.placeholder}</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {sort && (
        <select value={sort.value} onChange={(e) => sort.onChange(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {sort.options.map((o) => <option key={o.value} value={o.value}>↕ {o.label}</option>)}
        </select>
      )}
      <div className="mr-auto">{children}</div>
    </div>
  );
}
