import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatRM, generateReportRef } from "@/lib/format";

export default function EmployerPayment() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vr, setVr] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase.from("verification_requests").select("*, certificate:certificates(*, university:universities(name, commission_rate))").eq("id", id).maybeSingle();
      setVr(v);
      const { data: s } = await supabase.from("payment_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      setSettings(s);
    })();
  }, [id]);

  if (!vr || !settings) return <AppLayout title="Payment"><Loader2 className="h-5 w-5 animate-spin text-primary" /></AppLayout>;

  const fee = Number(settings.verification_fee);
  const gateway = 1;
  const platformRate = Number(settings.platform_commission_rate) / 100;
  const platform = (fee - gateway) * platformRate;
  const uniShare = fee - gateway - platform;

  const pay = async () => {
    setBusy(true);
    const ref = generateReportRef();
    const { error: e1 } = await supabase.from("verification_requests").update({
      payment_status: "paid", status: "completed", report_reference_no: ref,
    }).eq("id", vr.id);
    if (e1) { setBusy(false); return toast.error(e1.message); }
    const { error: e2 } = await supabase.from("transactions").insert({
      verification_request_id: vr.id, amount: fee, university_share: uniShare, platform_share: platform,
      gateway_fee: gateway, payment_gateway: settings.payment_gateway_name,
      payment_reference: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      payment_status: "paid", paid_at: new Date().toISOString(),
    });
    setBusy(false);
    if (e2) return toast.error(e2.message);
    toast.success("Payment successful");
    nav(`/employer/report/${vr.id}`);
  };

  return (
    <AppLayout title="Mock Payment" breadcrumbs={[{ label: "Employer" }, { label: "Search", to: "/employer/search" }, { label: "Payment" }]}>
      <div className="max-w-2xl mx-auto grid gap-6">
        <Card>
          <CardHeader><CardTitle>Certificate</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Student" value={vr.certificate?.student_name} />
            <Row label="University" value={vr.certificate?.university?.name} />
            <Row label="Programme" value={vr.certificate?.programme_name} />
            <Row label="Certificate no." value={vr.certificate?.certificate_number} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Verification fee" value={formatRM(fee)} />
            <Row label="Gateway fee" value={formatRM(gateway)} muted />
            <div className="border-t pt-3 flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-2xl font-bold text-primary">{formatRM(fee)}</span></div>
            <Button onClick={pay} disabled={busy} className="w-full" size="lg">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay {formatRM(fee)} now</>}</Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Mock payment for MVP demo. No real charge.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const Row = ({ label, value, muted }: any) => (
  <div className="flex items-center justify-between text-sm">
    <span className={muted ? "text-muted-foreground" : "text-muted-foreground"}>{label}</span>
    <span className={muted ? "text-muted-foreground" : "font-medium"}>{value}</span>
  </div>
);
