import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function usePaged<T>(rows: T[], page: number, pageSize = 10) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const slice = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { slice, total, pages, page: safePage };
}

export function Paginator({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {pages} • {total} record{total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page >= pages}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
