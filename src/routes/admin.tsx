import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminNav } from "@/config/navigation";
import { RequireRole } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: AdminShell });

function AdminShell() {
  return (
    <RequireRole role="admin">
      <DashboardLayout items={adminNav} areaLabel="Admin portal">
        <Outlet />
      </DashboardLayout>
    </RequireRole>
  );
}
