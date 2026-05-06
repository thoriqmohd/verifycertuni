import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, { cls: string; label: string }> = {
  valid:      { cls: "bg-success/10 text-success border-success/20", label: "Valid" },
  active:     { cls: "bg-success/10 text-success border-success/20", label: "Active" },
  paid:       { cls: "bg-success/10 text-success border-success/20", label: "Paid" },
  completed:  { cls: "bg-success/10 text-success border-success/20", label: "Completed" },
  revoked:    { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Revoked" },
  failed:     { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Failed" },
  suspended:  { cls: "bg-warning/10 text-warning border-warning/20", label: "Suspended" },
  pending:    { cls: "bg-muted text-muted-foreground border-border", label: "Pending" },
  unpaid:     { cls: "bg-muted text-muted-foreground border-border", label: "Unpaid" },
  inactive:   { cls: "bg-muted text-muted-foreground border-border", label: "Inactive" },
  processing: { cls: "bg-primary/10 text-primary border-primary/20", label: "Processing" },
  refunded:   { cls: "bg-muted text-muted-foreground border-border", label: "Refunded" },
  cancelled:  { cls: "bg-muted text-muted-foreground border-border", label: "Cancelled" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = map[status?.toLowerCase()] ?? { cls: "bg-muted text-muted-foreground border-border", label: status };
  return <Badge variant="outline" className={cn("font-medium capitalize", m.cls, className)}>{m.label}</Badge>;
}
