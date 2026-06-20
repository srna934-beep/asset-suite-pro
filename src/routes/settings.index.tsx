import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "الإعدادات | إدارة الأملاك" }] }),
  component: () => <ComingSoon title="الإعدادات" icon={Settings} desc="إعدادات النظام والمستخدمين والصلاحيات." tone="bg-slate-100 text-slate-700" />,
});
