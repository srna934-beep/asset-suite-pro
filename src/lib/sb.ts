import { supabase } from "@/integrations/supabase/client";

/** Untyped table accessor for tables not yet in generated types (vehicles, lands, employees, etc). */
export function sb(table: string) {
  return (supabase as any).from(table);
}

/** Fetch helper that returns rows as any[]. */
export async function sbAll(table: string, build?: (q: any) => any): Promise<any[]> {
  let q = sb(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}
