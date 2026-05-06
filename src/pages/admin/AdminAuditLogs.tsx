import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/StatCard";

export default function AdminAuditLogs() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");

  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows(data ?? []));
  }, []);

  const modules = Array.from(new Set(rows.map((r) => r.module).filter(Boolean)));
  const filtered = rows.filter((r) =>
    (mod === "all" || r.module === mod) &&
    (q === "" || r.description?.toLowerCase().includes(q.toLowerCase()) || r.action?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppLayout title="Audit Logs" breadcrumbs={[{ label: "Admin" }, { label: "Audit Logs" }]}>
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search description or action..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Select value={mod} onValueChange={setMod}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? <EmptyState icon={<Search className="h-5 w-5" />} title="No audit entries" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Module</TableHead><TableHead>Description</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
                    <TableCell className="text-sm">{r.module}</TableCell>
                    <TableCell className="text-sm">{r.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
