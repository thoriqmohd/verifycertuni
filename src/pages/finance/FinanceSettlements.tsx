import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDate } from "@/lib/format";
import { CheckCircle2, BadgeDollarSign, Search } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Paginator, usePaged } from "@/components/Pagination";
import { EmptyState } from "@/components/StatCard";

export default function FinanceSettlements() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [s, setS] = useState("all");
  const [page, setPage] = useState(1);

  const load = () => supabase.from("settlements").select("*, university:universities(name)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (s === "all" || r.settlement_status === s) &&
    (q === "" || r.university?.name?.toLowerCase().includes(q.toLowerCase()) || r.settlement_month?.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, s]);
  useEffect(() => { setPage(1); }, [q, s]);
  const { slice, pages, page: pg, total } = usePaged(filtered, page, 10);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("settlements").update({ settlement_status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Settlement marked as paid"); load(); }
  };

  return (
    <AppLayout title="Settlements" breadcrumbs={[{ label: "Finance" }, { label: "Settlements" }]}>
      <Card><CardContent className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by university or month..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={s} onValueChange={setS}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<BadgeDollarSign className="h-5 w-5" />} title="No settlements yet" description="Monthly settlement runs will appear here." />
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>University</TableHead><TableHead>Month</TableHead><TableHead className="hidden md:table-cell">Transactions</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Paid at</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {slice.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.university?.name}</TableCell>
                      <TableCell>{r.settlement_month}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.total_transactions}</TableCell>
                      <TableCell className="tabular-nums font-medium">{formatRM(r.total_amount)}</TableCell>
                      <TableCell><StatusBadge status={r.settlement_status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{formatDate(r.paid_at)}</TableCell>
                      <TableCell className="text-right">
                        {r.settlement_status !== "paid" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4 mr-1" /> Mark paid</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark settlement as paid?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will record <strong>{formatRM(r.total_amount)}</strong> as paid out to <strong>{r.university?.name}</strong> for {r.settlement_month}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => markPaid(r.id)}>Confirm</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginator page={pg} pages={pages} total={total} onChange={setPage} />
          </>
        )}
      </CardContent></Card>
    </AppLayout>
  );
}
