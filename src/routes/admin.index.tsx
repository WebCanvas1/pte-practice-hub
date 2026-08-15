import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  GraduationCap,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { ModuleScoreChart } from "@/components/common/charts";
import { PageHeader, SectionCard, StatCard } from "@/components/common/ui-blocks";
import { fetchAdminAnalytics } from "@/lib/tests-api";
import { formatPrice } from "@/config/site";

export const Route = createFileRoute("/admin/")({ component: Page });
function Page() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
    refetchInterval: 60000,
  });
  const a = data?.analytics;
  if (!a)
    return (
      <PageHeader title="Platform overview" description="Loading verified platform metrics…" />
    );
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Platform overview"
        description="Live D1 usage, performance and revenue metrics."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={String(a.activeStudents)} icon={Activity} />
        <StatCard label="Registered students" value={String(a.registeredStudents)} icon={Users} />
        <StatCard label="Tests purchased" value={String(a.testsPurchased)} icon={ShoppingCart} />
        <StatCard label="Tests completed" value={String(a.testsCompleted)} icon={CheckCircle2} />
        <StatCard label="Completion rate" value={`${a.completionRate}%`} icon={GraduationCap} />
        <StatCard label="Average score" value={`${a.averageScore}%`} icon={Activity} />
        <StatCard label="AI failures" value={String(a.aiFailures)} icon={Sparkles} />
        <StatCard label="Revenue" value={formatPrice(a.revenue)} icon={Wallet} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Popular modules" description="Attempt volume">
          <ModuleScoreChart data={a.modules} domainMax="auto" />
        </SectionCard>
        <SectionCard
          title="Popular difficulty levels"
          description="Attempt volume and average score"
        >
          <ModuleScoreChart data={a.difficulties} domainMax="auto" />
        </SectionCard>
      </div>
      <SectionCard
        title="Weakest question types"
        description="Lowest average accuracy across students"
      >
        <ModuleScoreChart data={a.weakestTypes} />
      </SectionCard>
    </div>
  );
}
