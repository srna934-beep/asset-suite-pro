import { useQuery, queryOptions } from "@tanstack/react-query";
import { sb } from "@/lib/sb";

export type AssetTypeScope = "property" | "land" | "vehicle";

export type AssetTypeRow = {
  id: string;
  scope: AssetTypeScope;
  key: string;
  name: string;
  category: string | null;
  is_farm: boolean;
  display_order: number;
  active: boolean;
  system: boolean;
};

export const assetTypesQuery = queryOptions({
  queryKey: ["asset-types"],
  queryFn: async () => {
    const { data } = await sb("asset_types")
      .select("*")
      .order("scope")
      .order("display_order")
      .order("name");
    return (data ?? []) as AssetTypeRow[];
  },
  staleTime: 60_000,
});

/** أنواع الأصول القابلة للتخصيص — مصدر موحّد لكل الشاشات. */
export function useAssetTypes(scope?: AssetTypeScope) {
  const { data } = useQuery(assetTypesQuery);
  const all = data ?? [];
  const rows = scope ? all.filter((t) => t.scope === scope) : all;
  const active = rows.filter((t) => t.active);

  const options = active.map((t) => ({
    value: t.id,
    label: t.category ? `${t.name} — ${t.category}` : t.name,
  }));

  const byId: Record<string, AssetTypeRow> = {};
  all.forEach((t) => (byId[t.id] = t));

  return {
    all,
    rows,
    options,
    byId,
    typeName: (id?: string | null) => (id ? (byId[id]?.name ?? "—") : "—"),
    /** هل النوع مزرعة/بستان/محمية/مراعي → تفعيل إدارة المزرعة تلقائياً. */
    isFarm: (id?: string | null) => (id ? !!byId[id]?.is_farm : false),
  };
}
