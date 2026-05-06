import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { maskName, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/StatCard";
import { toast } from "sonner";

export default function EmployerSearch() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [unis, setUnis] = useState<any[]>([]);
  const [f, setF] = useState({ certificate_number: "", student_name: "", ic: "", university_id: "all", programme: "" });
  const [results, setResults] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.from("universities").select("id,name").order("name").then(({ data }) => setUnis(data ?? [])); }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let q = supabase.from("certificates").select("*, university:universities(name)");
    if (f.certificate_number) q = q.ilike("certificate_number", `%${f.certificate_number}%`);
    if (f.student_name) q = q.ilike("student_name", `%${f.student_name}%`);
    if (f.ic) q = q.ilike("ic_passport", `%${f.ic}%`);
    if (f.university_id !== "all") q = q.eq("university_id", f.university_id);
    if (f.programme) q = q.ilike("programme_name", `%${f.programme}%`);
    const { data, error } = await q.limit(25);
    setBusy(false);
    if (error) return toast.error(error.message);
    setResults(data ?? []);
  };

  const startVerification = async (cert: any) => {
    if (!profile?.company_id) return toast.error("Company profile missing");
    const { data, error } = await supabase.from("verification_requests").insert({
      certificate_id: cert.id, company_id: profile.company_id, requested_by: profile.user_id,
      status: "pending", payment_status: "unpaid",
    }).select().single();
    if (error) return toast.error(error.message);
    nav(`/employer/payment/${data.id}`);
  };

  return (
    <AppLayout title="Search Certificate" breadcrumbs={[{ label: "Employer" }, { label: "Search" }]}>
      <Card className="mb-6">
        <CardHeader><CardTitle>Search criteria</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={search} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label>Certificate number</Label><Input value={f.certificate_number} onChange={(e) => setF({ ...f, certificate_number: e.target.value })} placeholder="e.g. UTM-2023-CS-00451" /></div>
            <div><Label>Student name</Label><Input value={f.student_name} onChange={(e) => setF({ ...f, student_name: e.target.value })} /></div>
            <div><Label>IC / Passport</Label><Input value={f.ic} onChange={(e) => setF({ ...f, ic: e.target.value })} /></div>
            <div><Label>University</Label>
              <Select value={f.university_id} onValueChange={(v) => setF({ ...f, university_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All universities</SelectItem>{unis.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Programme</Label><Input value={f.programme} onChange={(e) => setF({ ...f, programme: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Search</>}</Button></div>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <Card>
          <CardHeader><CardTitle>{results.length} result{results.length === 1 ? "" : "s"}</CardTitle></CardHeader>
          <CardContent>
            {results.length === 0 ? <EmptyState icon={<Search className="h-5 w-5" />} title="No matches" description="Try adjusting your search criteria." /> : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 flex items-center justify-between gap-4 hover:shadow-[var(--shadow-soft)] transition-shadow">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1"><span className="font-semibold">{maskName(r.student_name)}</span><StatusBadge status={r.certificate_status} /></div>
                      <div className="text-sm text-muted-foreground">{r.university?.name} • {r.programme_name}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{r.certificate_number} • Graduated {formatDate(r.graduation_date)}</div>
                    </div>
                    <Button onClick={() => startVerification(r)}><ShieldCheck className="h-4 w-4 mr-1" /> Verify & Get Full Report</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
