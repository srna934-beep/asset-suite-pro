import { createFileRoute, redirect } from "@tanstack/react-router";

// لوحة تحكم العقارات مدمجة الآن في صفحة العقارات نفسها
export const Route = createFileRoute("/properties-dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/properties", replace: true });
  },
  component: () => null,
});
