import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, BadgeDollarSign, TrendingUp, Receipt } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDate } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function FinanceDashboard() {
  const [t, setT] = useState<any[]>([]);
  const [s, setS] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).then(({ data }) => setT(data ?? []));
    supabase.from("settlements").select("*, university:universities(name)").order("created_at", { ascending: false }).then(({ data }) => setS(data ?? []));
  }, []);

  const totalRev = t.reduce((s, r) => s + Number(r.amount), 0);
  const platform = t.reduce((s, r) => s + Number(r.platform_share), 0);
  const uniPayable = s.filter((x) => x.settlement_status !== "paid").reduce((sum, x) => sum + Number(x.total_amount), 0);
  const fees = t.reduce((s, r) => s + Number(r.gateway_fee), 0);

  const monthly: Record<string, { month: string; revenue: number }> = {};
  t.forEach((r: any) => {
    const d = new Date(r.paid_at ?? r.created_at);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[k]) monthly[k] = { month: k, revenue: 0 };
    monthly[k].revenue += Number(r.amount);
  });
  const trend = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <AppLayout title="Finance Overview" breadcrumbs={[{ label: "Finance" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatRM(totalRev)} icon={<Wallet className="h-5 w-5" />} accent="success" />
        <StatCard label="Platform Share" value={formatRM(platform)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Payable to Universities" value={formatRM(uniPayable)} icon={<BadgeDollarSign className="h-5 w-5" />} accent="warning" />
        <StatCard label="Gateway Fees" value={formatRM(fees)} icon={<Receipt className="h-5 w-5" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Monthly revenue</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Settlements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>University</TableHead><TableHead>Month</TableHead><TableHead>Transactions</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Paid at</TableHead></TableRow></TableHeader>
            <TableBody>
              {s.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.university?.name}</TableCell>
                  <TableCell>{r.settlement_month}</TableCell>
                  <TableCell>{r.total_transactions}</TableCell>
                  <TableCell>{formatRM(r.total_amount)}</TableCell>
                  <TableCell><StatusBadge status={r.settlement_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.paid_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
