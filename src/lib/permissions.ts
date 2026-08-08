/**
 * نظام الصلاحيات المركزي
 * ----------------------
 * - المدير العام (super_admin): كل الصلاحيات بدون استثناء.
 * - باقي الأدوار: صلاحيات افتراضية بحسب الدور، ويستطيع المدير العام منح أو منع
 *   أي صلاحية لأي مستخدم على أي وحدة (تُخزَّن في جدول user_module_visibility
 *   بدون أي تعديل على قاعدة البيانات: المفتاح = "المسار#الإجراء").
 */

export const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "print",
  "export",
  "import",
  "approve",
] as const;

export type PermAction = (typeof ACTIONS)[number];

export const ACTION_LABEL: Record<PermAction, string> = {
  view: "عرض",
  create: "إضافة",
  edit: "تعديل",
  delete: "حذف",
  print: "طباعة",
  export: "تصدير",
  import: "استيراد",
  approve: "اعتماد",
};

export type ModuleDef = { key: string; label: string; group: string };

export const MODULES: ModuleDef[] = [
  { key: "/goals", label: "الأهداف", group: "التخطيط" },
  { key: "/budgets", label: "الميزانية المالية", group: "التخطيط" },
  { key: "/", label: "لوحة التحكم", group: "الرئيسية" },
  { key: "/properties", label: "العقارات", group: "الأصول" },
  { key: "/units", label: "الوحدات", group: "الأصول" },
  { key: "/lands", label: "الأراضي", group: "الأصول" },
  { key: "/vehicles", label: "المركبات", group: "الأصول" },
  { key: "/projects", label: "المشاريع", group: "المشاريع" },
  { key: "/tenants", label: "المستأجرين", group: "العملاء والعقود" },
  { key: "/contracts", label: "العقود", group: "العملاء والعقود" },
  { key: "/payments", label: "الدفعات", group: "العملاء والعقود" },
  { key: "/maintenance", label: "الصيانة", group: "العمليات" },
  { key: "/documents", label: "الوثائق", group: "العمليات" },
  { key: "/tasks", label: "المهام", group: "العمليات" },
  { key: "/messages", label: "الرسائل", group: "العمليات" },
  { key: "/notifications-center", label: "التنبيهات", group: "العمليات" },
  { key: "/employees", label: "الموظفين", group: "الموارد البشرية" },
  { key: "/departments", label: "الأقسام", group: "الموارد البشرية" },
  { key: "/payroll", label: "الرواتب", group: "الموارد البشرية" },
  { key: "/employment-contracts", label: "عقود الموظفين", group: "الموارد البشرية" },
  { key: "/attendance", label: "الحضور والانصراف", group: "الموارد البشرية" },
  { key: "/leaves", label: "الإجازات", group: "الموارد البشرية" },

  { key: "/finance-dashboard", label: "لوحة المالية", group: "المالية" },
  { key: "/accounts", label: "الحسابات", group: "المالية" },
  { key: "/transactions", label: "الحركات المالية", group: "المالية" },
  { key: "/accounting", label: "المحاسبة", group: "المالية" },
  { key: "/reports", label: "التقارير", group: "المالية" },
  { key: "/settings", label: "الإعدادات", group: "النظام" },
  { key: "/audit-logs", label: "سجل التدقيق", group: "النظام" },
  { key: "/super-admin", label: "إدارة النظام (مدير عام فقط)", group: "النظام" },
];

/** مسارات لا تخضع للصلاحيات (شخصية أو عامة). */
export const OPEN_PATHS = ["/auth", "/reset-password", "/profile"];

export function permKey(moduleKey: string, action: PermAction) {
  return action === "view" ? moduleKey : `${moduleKey}#${action}`;
}

/** استخراج مفتاح الوحدة من المسار الحالي (أطول تطابق). */
export function moduleForPath(pathname: string): string | null {
  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/";
  let best: string | null = null;
  for (const m of MODULES) {
    if (m.key === "/") continue;
    if (clean === m.key || clean.startsWith(`${m.key}/`)) {
      if (!best || m.key.length > best.length) best = m.key;
    }
  }
  return best;
}

export function moduleLabel(key: string) {
  return MODULES.find((m) => m.key === key)?.label ?? key;
}

/** الصلاحيات الافتراضية لكل دور قبل تخصيص المدير العام. */
export const ROLE_DEFAULTS: Record<string, { view: boolean; actions: PermAction[] }> = {
  super_admin: { view: true, actions: [...ACTIONS] },
  admin: { view: true, actions: ["view", "create", "edit", "export", "print", "approve"] },
  manager: { view: true, actions: ["view", "create", "edit", "export", "print"] },
  accountant: { view: true, actions: ["view", "create", "edit", "export", "print"] },
  hr: { view: true, actions: ["view", "create", "edit", "export", "print"] },
  user: { view: true, actions: ["view"] },
};

/** وحدات مخصّصة للمدير العام فقط. */
export const SUPER_ADMIN_ONLY = ["/super-admin", "/audit-logs", "/settings"];
