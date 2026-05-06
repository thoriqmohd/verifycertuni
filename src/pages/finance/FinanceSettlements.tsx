import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDate } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FinanceSettlements() {
  const [rows, setRows] = useState<any[]>([]);

  const load = () => supabase.from("settlements").select("*, university:universities(name)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("settlements").update({ settlement_status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Settlement marked as paid"); load(); }
  };

  return (
    <AppLayout title="Settlements" breadcrumbs={[{ label: "Finance" }, { label: "Settlements" }]}>
      <Card><CardContent className="p-4 lg:p-6">
        <Table>
          <TableHeader><TableRow><TableHead>University</TableHead><TableHead>Month</TableHead><TableHead>Transactions</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Paid at</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm font-medium">{r.university?.name}</TableCell>
                <TableCell>{r.settlement_month}</TableCell>
                <TableCell>{r.total_transactions}</TableCell>
                <TableCell>{formatRM(r.total_amount)}</TableCell>
                <TableCell><StatusBadge status={r.settlement_status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(r.paid_at)}</TableCell>
                <TableCell>{r.settlement_status !== "paid" && <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Mark paid</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </AppLayout>
  );
}
