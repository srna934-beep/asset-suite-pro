import { useMemo } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { sb } from "@/lib/sb";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { Section } from "@/components/asset-detail";
import { Layers, Building, Boxes, Layers3 } from "lucide-react";
import { toast } from "sonner";

export type NodeRow = {
  id: string;
  property_id: string;
  parent_id: string | null;
  node_type: "مبنى" | "بلوك" | "دور";
  name: string;
  code: string | null;
  floor_number: number | null;
  area_sqm: number | null;
  status: string;
  notes: string | null;
  display_order: number;
};

export function propertyNodesQuery(propertyId: string) {
  return queryOptions({
    queryKey: ["property-nodes", propertyId],
    queryFn: async () => {
      const { data } = await sb("property_nodes")
        .select("*")
        .eq("property_id", propertyId)
        .order("node_type")
        .order("display_order")
        .order("name");
      return (data ?? []) as NodeRow[];
    },
  });
}

const ICON: Record<string, React.ReactNode> = {
  "مبنى": <Building className="h-4 w-4 text-orange-600" />,
  "بلوك": <Boxes className="h-4 w-4 text-sky-600" />,
  "دور": <Layers3 className="h-4 w-4 text-violet-600" />,
};

/** الهيكل الهرمي للعقار: عقار → مبنى → بلوك → دور → وحدة. */
export function PropertyStructure({ propertyId, units }: { propertyId: string; units: any[] }) {
  const qc = useQueryClient();
  const { data: nodes = [] } = useQuery(propertyNodesQuery(propertyId));
  const INV = [["property-nodes", propertyId], ["property", propertyId]];

  const nodeOpts = useMemo(
    () => nodes.map((n) => ({ value: n.id, label: `${n.node_type}: ${n.name}` })),
    [nodes],
  );

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "node_type", label: "المستوى", type: "select", required: true, options: [
      { value: "مبنى", label: "مبنى" }, { value: "بلوك", label: "بلوك" }, { value: "دور", label: "دور" },
    ]},
    { name: "name", label: "الاسم", required: true },
    { name: "code", label: "الرمز" },
    { name: "parent_id", label: "يتبع (المستوى الأعلى)", type: "select", options: nodeOpts },
    { name: "floor_number", label: "رقم الدور", type: "number", showWhen: { field: "node_type", equals: ["دور"] } },
    { name: "area_sqm", label: "المساحة (م²)", type: "number" },
    { name: "status", label: "الحالة", type: "select", options: [
      { value: "نشط", label: "نشط" }, { value: "قيد الإنشاء", label: "قيد الإنشاء" }, { value: "متوقف", label: "متوقف" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [nodeOpts]);

  const children = (parent: string | null) => nodes.filter((n) => (n.parent_id ?? null) === parent);
  const unitsOf = (nodeId: string) => units.filter((u: any) => u.node_id === nodeId);
  const unassigned = units.filter((u: any) => !u.node_id);

  async function assign(unitId: string, nodeId: string) {
    const { error } = await sb("units").update({ node_id: nodeId || null }).eq("id", unitId);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث موقع الوحدة");
    INV.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  }

  function renderNode(n: NodeRow, depth: number) {
    const kids = children(n.id);
    const nUnits = unitsOf(n.id);
    return (
      <div key={n.id} style={{ marginInlineStart: depth * 18 }} className="mt-2">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
          {ICON[n.node_type]}
          <span className="text-sm font-bold">{n.name}</span>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{n.node_type}</span>
          {n.code && <span className="font-mono text-[11px] text-muted-foreground">{n.code}</span>}
          {n.floor_number != null && <span className="text-[11px] text-muted-foreground">دور {n.floor_number}</span>}
          {n.area_sqm != null && <span className="text-[11px] text-muted-foreground">{Number(n.area_sqm).toLocaleString()} م²</span>}
          <span className="text-[11px] text-muted-foreground">• {nUnits.length} وحدة</span>
          <div className="ms-auto flex gap-1">
            <RecordDialog table="property_nodes" title="تعديل عنصر الهيكل" fields={FIELDS} initial={n} invalidate={INV} extra={{ property_id: propertyId }} />
            <DeleteButton table="property_nodes" id={n.id} invalidate={INV} />
          </div>
        </div>
        {nUnits.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5" style={{ marginInlineStart: 18 }}>
            {nUnits.map((u: any) => (
              <span key={u.id} className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold">
                وحدة {u.unit_number}
              </span>
            ))}
          </div>
        )}
        {kids.map((k) => renderNode(k, depth + 1))}
      </div>
    );
  }

  return (
    <Section title="الهيكل الإنشائي (مبانٍ / بلوكات / أدوار)" icon={<Layers className="h-5 w-5 text-orange-600" />}>
      <div className="p-4">
        <div className="mb-3 flex justify-end">
          <RecordDialog
            table="property_nodes"
            title="إضافة عنصر للهيكل"
            fields={FIELDS}
            invalidate={INV}
            defaults={{ node_type: "مبنى", status: "نشط" }}
            extra={{ property_id: propertyId }}
          />
        </div>

        {nodes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا يوجد هيكل بعد. أضف مبنى ثم بلوكات وأدوار، ووزّع الوحدات عليها.
          </p>
        ) : (
          children(null).map((n) => renderNode(n, 0))
        )}

        {nodes.length > 0 && unassigned.length > 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-border p-3">
            <div className="mb-2 text-xs font-bold text-muted-foreground">وحدات غير موزّعة على الهيكل ({unassigned.length})</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {unassigned.map((u: any) => (
                <div key={u.id} className="flex items-center gap-2">
                  <span className="text-sm font-semibold">وحدة {u.unit_number}</span>
                  <select
                    className="ms-auto h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => assign(u.id, e.target.value)}
                  >
                    <option value="">— تعيين إلى —</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.node_type}: {n.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
