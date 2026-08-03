import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingState } from "@/components/common/ui-blocks";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | undefined;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  caption?: string | undefined;
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  getRowKey: (row: T, index: number) => string;
}

/** Reusable, accessible, horizontally scrollable data table. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  loading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  getRowKey,
}: DataTableProps<T>) {
  if (loading) return <LoadingState rows={3} />;
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} className="py-10" />;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                scope="col"
                className={col.align === "right" ? "text-right" : undefined}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={getRowKey(row, index)}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={col.align === "right" ? "text-right" : undefined}
                >
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
