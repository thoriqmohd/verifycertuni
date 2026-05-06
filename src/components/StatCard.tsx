import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, hint, accent }: { label: string; value: ReactNode; icon: ReactNode; hint?: string; accent?: "primary" | "success" | "warning" | "destructive" }) {
  const tone = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[accent ?? "primary"];
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="text-2xl lg:text-3xl font-bold mt-2">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", tone)}>{icon}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-3 text-muted-foreground">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
}
