import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Bell } from "lucide-react";
export const Route = createFileRoute("/tasks/")({
  head: () => ({ meta: [{ title: "المهام والتنبيهات" }] }),
  component: () => <ComingSoon title="المهام والتنبيهات" icon={Bell} desc="المهام اليومية وتنبيهات الدفعات والعقود." tone="bg-rose-100 text-rose-700" />,
});
