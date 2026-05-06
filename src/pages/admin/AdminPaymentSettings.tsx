import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { formatRM } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AdminPaymentSettings() {
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("payment_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setS(data));
  }, []);

  const save = async () => {
    if (!s) return;
    setBusy(true);
    const { error } = await supabase.from("payment_settings").update({
      verification_fee: Number(s.verification_fee),
      platform_commission_rate: Number(s.platform_commission_rate),
      payment_gateway_name: s.payment_gateway_name,
      billplz_sandbox: !!s.billplz_sandbox,
      billplz_api_key: s.billplz_api_key ?? "",
      billplz_collection_id: s.billplz_collection_id ?? "",
      billplz_x_signature: s.billplz_x_signature ?? "",
    }).eq("id", s.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const fillDummy = () => {
    setS({
      ...s,
      payment_gateway_name: "Billplz",
      billplz_sandbox: true,
      billplz_api_key: "sk_sandbox_dummy_" + Math.random().toString(36).slice(2, 10),
      billplz_collection_id: "dummy" + Math.random().toString(36).slice(2, 8),
      billplz_x_signature: "S-sig-" + Math.random().toString(36).slice(2, 14),
    });
    toast.success("Dummy Billplz sandbox credentials filled — click Save to persist");
  };

  if (!s) return <AppLayout title="Payment Settings"><Loader2 className="h-5 w-5 animate-spin text-primary" /></AppLayout>;

  const fee = Number(s.verification_fee || 0);
  const gateway = 1;
  const platform = (fee - gateway) * (Number(s.platform_commission_rate) / 100);
  const uni = fee - gateway - platform;

  return (
    <AppLayout title="Payment Settings" breadcrumbs={[{ label: "Admin" }, { label: "Payment Settings" }]}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Verification fee (RM)</Label><Input type="number" value={s.verification_fee} onChange={(e) => setS({ ...s, verification_fee: e.target.value })} /></div>
            <div><Label>Platform commission (%)</Label><Input type="number" value={s.platform_commission_rate} onChange={(e) => setS({ ...s, platform_commission_rate: e.target.value })} /></div>
            <div><Label>Payment gateway</Label><Input value={s.payment_gateway_name} onChange={(e) => setS({ ...s, payment_gateway_name: e.target.value })} /></div>
            <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Billplz gateway</span>
              {s.billplz_sandbox ? <Badge variant="secondary"><FlaskConical className="h-3 w-3 mr-1" /> Sandbox</Badge> : <Badge>Live</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Sandbox mode</Label>
                <p className="text-xs text-muted-foreground">Use Billplz dummy/test credentials — no real money is moved.</p>
              </div>
              <Switch checked={!!s.billplz_sandbox} onCheckedChange={(v) => setS({ ...s, billplz_sandbox: v })} />
            </div>
            <div><Label>Billplz API key</Label><Input value={s.billplz_api_key ?? ""} onChange={(e) => setS({ ...s, billplz_api_key: e.target.value })} placeholder="sk_sandbox_..." /></div>
            <div><Label>Collection ID</Label><Input value={s.billplz_collection_id ?? ""} onChange={(e) => setS({ ...s, billplz_collection_id: e.target.value })} placeholder="abc123" /></div>
            <div><Label>X-Signature key</Label><Input value={s.billplz_x_signature ?? ""} onChange={(e) => setS({ ...s, billplz_x_signature: e.target.value })} placeholder="S-..." /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fillDummy}><FlaskConical className="h-4 w-4 mr-1" /> Fill dummy sandbox</Button>
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sandbox endpoint: <code>https://www.billplz-sandbox.com/api/v3</code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Example calculation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Verification fee" value={formatRM(fee)} />
            <Row label="Gateway fee" value={`− ${formatRM(gateway)}`} />
            <Row label={`Platform share (${s.platform_commission_rate}%)`} value={formatRM(platform)} accent="primary" />
            <Row label="University share" value={formatRM(uni)} accent="success" />
            <div className="pt-3 border-t mt-3 text-sm text-muted-foreground">
              For every RM{fee.toFixed(2)} payment, the university receives <strong>{formatRM(uni)}</strong>, the platform retains <strong>{formatRM(platform)}</strong>, and the gateway charges <strong>{formatRM(gateway)}</strong>.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const Row = ({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
    <span className="text-sm">{label}</span>
    <span className={`font-semibold ${accent === "success" ? "text-success" : accent === "primary" ? "text-primary" : ""}`}>{value}</span>
  </div>
);
