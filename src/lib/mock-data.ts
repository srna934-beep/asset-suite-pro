export type PropertyStatus = "مؤجر" | "خاصة" | "متاح";
export type UnitStatus = "مؤجرة" | "فارغة" | "صيانة";
export type PaymentStatus = "مدفوع" | "متأخر" | "غير مدفوع";

export const properties = [
  { id: "p1", name: "عمارة السلام", type: "عمارة", location: "الرياض", units: 10, income: 1250, status: "مؤجر" as PropertyStatus },
  { id: "p2", name: "فيلا النخيل", type: "فيلا", location: "جدة", units: 1, income: 0, status: "خاصة" as PropertyStatus },
  { id: "p3", name: "مجمع التجارية", type: "مجمع", location: "الدمام", units: 20, income: 2600, status: "مؤجر" as PropertyStatus },
  { id: "p4", name: "عمارة الياسمين", type: "عمارة", location: "الرياض", units: 14, income: 2000, status: "مؤجر" as PropertyStatus },
];

export const units = [
  { id: "u1", number: "شقة 1", property: "عمارة السلام", type: "شقة", rent: 500, status: "مؤجرة" as UnitStatus, tenant: "أحمد محمد" },
  { id: "u2", number: "شقة 2", property: "عمارة السلام", type: "شقة", rent: 450, status: "مؤجرة" as UnitStatus, tenant: "سارة علي" },
  { id: "u3", number: "شقة 3", property: "عمارة السلام", type: "شقة", rent: 400, status: "فارغة" as UnitStatus, tenant: null },
  { id: "u4", number: "شقة 1", property: "عمارة الياسمين", type: "شقة", rent: 550, status: "مؤجرة" as UnitStatus, tenant: "محمد خالد" },
];

export const payments = [
  { id: "pay1", month: "يونيو 2024", tenant: "سارة علي", unit: "شقة 2", property: "عمارة السلام", date: "2024/06/01", amount: 450, status: "مدفوع" as PaymentStatus },
  { id: "pay2", month: "يونيو 2024", tenant: "سارة علي", unit: "شقة 2", property: "عمارة السلام", date: "2024/06/01", amount: 450, status: "مدفوع" as PaymentStatus },
  { id: "pay3", month: "يونيو 2024", tenant: "محمد خالد", unit: "شقة 1", property: "عمارة الياسمين", date: "2024/06/05", amount: 550, status: "متأخر" as PaymentStatus },
  { id: "pay4", month: "يونيو 2024", tenant: "—", unit: "شقة 3", property: "عمارة السلام", date: "—", amount: 400, status: "غير مدفوع" as PaymentStatus },
];

export const stats = {
  monthlyIncome: 5850,
  totalLate: 750,
  propertiesCount: 12,
  unitsCount: 45,
  tenantsCount: 28,
  expiringContracts: 3,
  paidThisMonth: 1900,
  totalLateAll: 550,
  owedTo: 400,
};
