import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, type AdminStudent } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/students")({ component: Page });
type Detail = {
  profile: Record<string, unknown>;
  purchases: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  entitlements: Record<string, unknown>[];
  activity: Record<string, unknown>[];
};

function Page() {
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [templateId, setTemplateId] = useState("");
  const load = () =>
    adminApi<{ students: AdminStudent[] }>("students", undefined, { search })
      .then((x) => setStudents(x.students))
      .catch((e) => toast.error(e.message));
  const open = (student: AdminStudent) => {
    setSelected(student);
    setDetail(null);
    void adminApi<Detail>("student-detail", undefined, { id: student.id })
      .then(setDetail)
      .catch((e) => toast.error(e.message));
  };
  const act = async (operation: string, extra: Record<string, string> = {}) => {
    if (!selected) return;
    try {
      const result = await adminApi<{ emailQueued?: boolean }>("student-action", {
        studentId: selected.id,
        operation,
        ...extra,
      });
      toast.success(
        operation === "password_reset"
          ? result.emailQueued
            ? "Password-reset email queued."
            : "Reset token created; configure email delivery to send it."
          : "Student account updated.",
      );
      open(selected);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Students"
        description="Search accounts and manage profiles, purchases, attempts, results and entitlements."
        actions={
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              placeholder="Name or email"
            />
            <Button onClick={() => void load()}>Search</Button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(420px,1fr)_minmax(480px,1.2fr)]">
        <SectionCard title={`Student accounts (${students?.length ?? 0})`}>
          {!students ? (
            <LoadingState rows={6} />
          ) : students.length === 0 ? (
            <EmptyState title="No students found" />
          ) : (
            <div className="divide-y rounded-lg border">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => open(s)}
                  className="grid w-full grid-cols-[1fr_auto] gap-3 p-4 text-left hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.purchases} purchases · {s.completed}/{s.attempts} tests completed
                    </p>
                  </div>
                  <Badge variant={s.status === "active" ? "success" : "warning"}>{s.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard
          title={selected ? `${selected.firstName} ${selected.lastName}` : "Student details"}
          description={selected?.email}
        >
          {!selected ? (
            <EmptyState
              title="Select a student"
              description="Open an account to view its complete history and controls."
            />
          ) : !detail ? (
            <LoadingState rows={6} />
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void act(selected.status === "active" ? "disable" : "reactivate")}
                >
                  {selected.status === "active" ? "Disable account" : "Reactivate account"}
                </Button>
                <Button variant="outline" onClick={() => void act("password_reset")}>
                  Trigger password reset
                </Button>
                <Button variant="destructive" onClick={() => void act("delete_workflow")}>
                  Start deletion workflow
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(detail, null, 2)], {
                      type: "application/json",
                    });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `student-${selected.id}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  Export student data
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="Published template ID"
                />
                <Button onClick={() => void act("grant_entitlement", { templateId })}>
                  Grant test
                </Button>
              </div>
              {(
                [
                  ["Purchases", detail.purchases],
                  ["Attempts and results", detail.attempts],
                  ["Entitlements", detail.entitlements],
                  ["Activity history", detail.activity],
                ] as const
              ).map(([title, rows]) => (
                <div key={title}>
                  <h3 className="mb-2 font-medium">{title}</h3>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No records.</p>
                  ) : (
                    <div className="grid gap-2">
                      {rows.map((row, i) => (
                        <div key={String(row["id"] ?? i)} className="rounded-md border p-3 text-xs">
                          <pre className="whitespace-pre-wrap font-sans">
                            {Object.entries(row)
                              .map(([k, v]) => `${k}: ${String(v ?? "—")}`)
                              .join(" · ")}
                          </pre>
                          {title === "Entitlements" && row["status"] === "active" ? (
                            <Button
                              className="mt-2"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void act("revoke_entitlement", { entitlementId: String(row["id"]) })
                              }
                            >
                              Revoke unused
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
