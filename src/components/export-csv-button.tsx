import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function toCsv(rows: any[], columns: { key: string; label: string }[]): string {
  const head = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = r[c.key];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(",")
  ).join("\n");
  return "\uFEFF" + head + "\n" + body;
}

export function ExportCsvButton({ rows, columns, filename }: { rows: any[]; columns: { key: string; label: string }[]; filename: string }) {
  function handle() {
    const csv = toCsv(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={rows.length === 0}>
      <Download className="ml-1 h-4 w-4" /> تصدير CSV
    </Button>
  );
}
