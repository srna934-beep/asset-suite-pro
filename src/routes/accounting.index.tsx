import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Calculator } from "lucide-react";
export const Route = createFileRoute("/accounting/")({
  head: () => ({ meta: [{ title: "المحاسبة والمالية" }] }),
  component: () => <ComingSoon title="المحاسبة والمالية" icon={Calculator} desc="دفاتر الإيرادات والمصاريف والأرباح والخسائر." tone="bg-emerald-100 text-emerald-700" />,
});
