import { createFileRoute, redirect } from "@tanstack/react-router";

// اللوحة مدمجة الآن داخل الصفحة نفسها (منع التكرار)
export const Route = createFileRoute("/vehicles-dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/vehicles", replace: true });
  },
  component: () => null,
});
