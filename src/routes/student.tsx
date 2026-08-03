import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { studentNav } from "@/config/navigation";
import { RequireRole } from "@/lib/auth";

export const Route = createFileRoute("/student")({ component: StudentShell });

function StudentShell() {
  return (
    <RequireRole role="student">
      <DashboardLayout items={studentNav} areaLabel="Student dashboard">
        <Outlet />
      </DashboardLayout>
    </RequireRole>
  );
}
