import { createFileRoute, redirect } from "@tanstack/react-router";

// اللوحة مدمجة الآن داخل الصفحة نفسها (منع التكرار)
export const Route = createFileRoute("/projects-dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/projects", replace: true });
  },
  component: () => null,
});
