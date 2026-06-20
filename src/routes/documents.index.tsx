import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { FolderOpen } from "lucide-react";
export const Route = createFileRoute("/documents/")({
  head: () => ({ meta: [{ title: "الوثائق | إدارة الأملاك" }] }),
  component: () => <ComingSoon title="الوثائق" icon={FolderOpen} desc="أرشيف الوثائق الرسمية لكل عقار ومستأجر وعقد." tone="bg-orange-100 text-orange-700" />,
});
