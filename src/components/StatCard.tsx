import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent,
  trend,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
  trend?: { value: number; label?: string };
}) {
  const tone = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[accent ?? "primary"];

  const trendUp = (trend?.value ?? 0) >= 0;
  return (
    <div className="stat-card group hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
          <div className="text-2xl lg:text-3xl font-bold mt-2 tabular-nums break-words">{value}</div>
          {trend && (
            <div className={cn("inline-flex items-center gap-1 mt-2 text-xs font-medium px-1.5 py-0.5 rounded",
              trendUp ? "text-success bg-success/10" : "text-destructive bg-destructive/10")}>
              {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trend.value).toFixed(0)}% {trend.label ?? "vs last month"}
            </div>
          )}
          {hint && !trend && <div className="text-xs text-muted-foreground mt-1.5">{hint}</div>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-current/5", tone)}>{icon}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-4 rounded-xl border border-dashed bg-muted/20">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-card border flex items-center justify-center mb-4 text-muted-foreground shadow-sm">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}
