import { createFileRoute, redirect } from "@tanstack/react-router";

// اللوحة مدمجة الآن داخل الصفحة نفسها (منع التكرار)
export const Route = createFileRoute("/lands-dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/lands", replace: true });
  },
  component: () => null,
});
