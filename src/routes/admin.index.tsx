import { createFileRoute } from "@tanstack/react-router";
import { Gauge, GraduationCap, Sparkles, Wallet } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { ScoreTrendChart } from "@/components/common/charts";
import { PageHeader, SectionCard, StatCard } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { adminAttempts, adminStats, revenueByWeek } from "@/data/placeholder";
import { formatPrice, siteConfig } from "@/config/site";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: `Admin overview — ${siteConfig.name}` }] }),
  component: AdminOverview,
});

function AdminOverview() {
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Placeholder metrics until reporting is connected to the backend."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={adminStats.students.toLocaleString()} icon={GraduationCap} />
        <StatCard label="Attempts today" value={String(adminStats.attemptsToday)} icon={Gauge} />
        <StatCard label="Revenue (month)" value={formatPrice(adminStats.revenueMonth)} icon={Wallet} />
        <StatCard
          label="Pending AI evaluations"
          value={String(adminStats.pendingEvaluations)}
          icon={Sparkles}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Revenue by week" description="Placeholder figures in AUD">
          <ScoreTrendChart data={revenueByWeek} />
        </SectionCard>
        <SectionCard title="Latest attempts" description="Most recent submissions">
          <DataTable
            caption="Latest test attempts"
            rows={adminAttempts}
            getRowKey={(row) => row.id}
            columns={[
              { key: "student", header: "Student", render: (r) => r.student },
              { key: "test", header: "Test", render: (r) => r.test },
              {
                key: "status",
                header: "Status",
                align: "right",
                render: (r) => (
                  <Badge variant={r.status === "Scored" ? "success" : "warning"}>{r.status}</Badge>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </>
  );
}
