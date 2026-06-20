import { supabase } from "@/integrations/supabase/client";

export type DBProperty = {
  id: string; name: string; type: string; location: string | null;
  status: "مؤجر" | "خاصة" | "متاح"; address: string | null;
  description: string | null; photos: string[] | null;
};
export type DBUnit = {
  id: string; property_id: string; unit_number: string; type: string;
  rent_amount: number; status: "مؤجرة" | "فارغة" | "صيانة";
  area_sqm: number | null; bedrooms: number | null; bathrooms: number | null;
  photos: string[] | null; notes: string | null;
};
export type DBTenant = {
  id: string; full_name: string; phone: string | null; email: string | null;
  national_id: string | null; address: string | null; notes: string | null;
};
export type DBContract = {
  id: string; unit_id: string; tenant_id: string; start_date: string;
  end_date: string; monthly_rent: number; status: string; deposit: number | null;
};
export type DBPayment = {
  id: string; contract_id: string; due_date: string; paid_date: string | null;
  amount: number; status: "مدفوع" | "متأخر" | "غير مدفوع"; payment_method: string | null;
};

export async function getDashboardData() {
  const [props, units, tenants, contracts, payments] = await Promise.all([
    supabase.from("properties").select("*").order("created_at"),
    supabase.from("units").select("*"),
    supabase.from("tenants").select("*"),
    supabase.from("contracts").select("*"),
    supabase.from("payments").select("*").order("due_date", { ascending: false }),
  ]);
  return {
    properties: (props.data ?? []) as DBProperty[],
    units: (units.data ?? []) as DBUnit[],
    tenants: (tenants.data ?? []) as DBTenant[],
    contracts: (contracts.data ?? []) as DBContract[],
    payments: (payments.data ?? []) as DBPayment[],
  };
}

export async function getPropertyDetail(id: string) {
  const [prop, units, expenses, docs, maint] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("units").select("*").eq("property_id", id).order("unit_number"),
    supabase.from("expenses").select("*").eq("property_id", id).order("expense_date", { ascending: false }),
    supabase.from("documents").select("*").eq("property_id", id),
    supabase.from("maintenance_requests").select("*").eq("property_id", id),
  ]);
  return {
    property: prop.data as DBProperty | null,
    units: (units.data ?? []) as DBUnit[],
    expenses: expenses.data ?? [],
    documents: docs.data ?? [],
    maintenance: maint.data ?? [],
  };
}

export async function getUnitDetail(id: string) {
  const { data: unit } = await supabase.from("units").select("*").eq("id", id).maybeSingle();
  if (!unit) return { unit: null, property: null, contract: null, tenant: null, payments: [] as DBPayment[] };
  const [prop, contract] = await Promise.all([
    supabase.from("properties").select("*").eq("id", unit.property_id).maybeSingle(),
    supabase.from("contracts").select("*").eq("unit_id", id).order("start_date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  let tenant = null;
  let payments: DBPayment[] = [];
  if (contract.data) {
    const [t, p] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", contract.data.tenant_id).maybeSingle(),
      supabase.from("payments").select("*").eq("contract_id", contract.data.id).order("due_date", { ascending: false }),
    ]);
    tenant = t.data;
    payments = (p.data ?? []) as DBPayment[];
  }
  return {
    unit: unit as DBUnit,
    property: prop.data as DBProperty | null,
    contract: contract.data as DBContract | null,
    tenant: tenant as DBTenant | null,
    payments,
  };
}

export async function markPaymentPaid(paymentId: string) {
  return supabase.from("payments")
    .update({ status: "مدفوع", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", paymentId);
}

export async function refreshLatePayments() {
  const today = new Date().toISOString().slice(0, 10);
  return supabase.from("payments")
    .update({ status: "متأخر" })
    .lt("due_date", today)
    .eq("status", "غير مدفوع");
}
