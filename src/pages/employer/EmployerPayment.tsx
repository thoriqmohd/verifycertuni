import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ShieldCheck, FileText, Stamp, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatRM, generateReportRef } from "@/lib/format";

type AddOn = { id: string; name: string; desc: string; price: number; icon: any; popular?: boolean };

const ADD_ONS: AddOn[] = [
  { id: "transcript", name: "Official academic transcript", desc: "Full course-by-course transcript with grades, CGPA & credit hours.", price: 35, icon: FileText, popular: true },
  { id: "hardcopy", name: "Certified hardcopy + courier", desc: "University-stamped printout couriered within 3 working days.", price: 25, icon: Stamp },
  { id: "rush", name: "Rush processing (priority queue)", desc: "Get your verification report in under 30 minutes.", price: 10, icon: Zap },
];

export default function EmployerPayment() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vr, setVr] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase.from("verification_requests").select("*, certificate:certificates(*, university:universities(name, commission_rate))").eq("id", id).maybeSingle();
      setVr(v);
      const { data: s } = await supabase.from("payment_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      setSettings(s);
    })();
  }, [id]);

  const addOnsTotal = useMemo(
    () => ADD_ONS.filter((a) => picked[a.id]).reduce((sum, a) => sum + a.price, 0),
    [picked],
  );

  if (!vr || !settings) return <AppLayout title="Payment"><Loader2 className="h-5 w-5 animate-spin text-primary" /></AppLayout>;

  const fee = Number(settings.verification_fee);
  const gateway = 1;
  const platformRate = Number(settings.platform_commission_rate) / 100;
  const subtotal = fee + addOnsTotal;
  // Add-ons go entirely to the issuing university (their service); base fee splits as usual.
  const platform = (fee - gateway) * platformRate;
  const uniShare = fee - gateway - platform + addOnsTotal;

  const pay = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("users_profile").select("full_name, email").eq("user_id", user!.id).maybeSingle();
      const selectedAddOns = ADD_ONS.filter((a) => picked[a.id]).map((a) => a.id).join(",");
      const returnUrl = `${window.location.origin}/employer/payment-return/${vr.id}`;
      const { data, error } = await supabase.functions.invoke("billplz-create-bill", {
        body: {
          verification_request_id: vr.id,
          amount: subtotal,
          description: `Verification ${vr.certificate?.certificate_number ?? ""}`.trim(),
          name: profile?.full_name ?? user?.email ?? "Customer",
          email: profile?.email ?? user?.email,
          addons: selectedAddOns,
          return_url: returnUrl,
        },
      });
      if (error || !data?.payment_url) throw new Error(error?.message ?? "Failed to create bill");
      window.location.href = data.payment_url;
    } catch (e: any) {
      setBusy(false);
      toast.error(e.message ?? "Payment failed to start");
    }
  };

  return (
    <AppLayout title="Billplz Payment" breadcrumbs={[{ label: "Employer" }, { label: "Search", to: "/employer/search" }, { label: "Payment" }]}>
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

        {/* Up-sell add-ons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Need more? Add to your verification
            </CardTitle>
            <p className="text-xs text-muted-foreground">Optional university-issued documents — fees go directly to the issuing university.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {ADD_ONS.map((a) => {
              const Icon = a.icon;
              const checked = !!picked[a.id];
              return (
                <label
                  key={a.id}
                  htmlFor={`addon-${a.id}`}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                >
                  <Checkbox
                    id={`addon-${a.id}`}
                    checked={checked}
                    onCheckedChange={(v) => setPicked((p) => ({ ...p, [a.id]: !!v }))}
                    className="mt-0.5"
                  />
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.name}</span>
                      {a.popular && <Badge variant="secondary" className="text-[10px]">Most popular</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                  <span className="font-semibold text-sm whitespace-nowrap">+ {formatRM(a.price)}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Verification fee" value={formatRM(fee)} />
            {ADD_ONS.filter((a) => picked[a.id]).map((a) => (
              <Row key={a.id} label={a.name} value={`+ ${formatRM(a.price)}`} />
            ))}
            <Row label="Gateway fee" value={formatRM(gateway)} muted />
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatRM(subtotal)}</span>
            </div>
            <Button onClick={pay} disabled={busy} className="w-full" size="lg">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay {formatRM(subtotal)} now</>}
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Mock payment for MVP demo. No real charge.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const Row = ({ label, value, muted }: any) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={muted ? "text-muted-foreground" : "font-medium"}>{value}</span>
  </div>
);
