import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { BarChart3 } from "lucide-react";
export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "التقارير | إدارة الأملاك" }] }),
  component: () => <ComingSoon title="التقارير" icon={BarChart3} desc="تقارير الدخل والمصاريف والإشغال الشهرية والسنوية." tone="bg-violet-100 text-violet-700" />,
});
