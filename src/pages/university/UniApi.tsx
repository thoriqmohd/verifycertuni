import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, Copy, RefreshCw, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateApiKey, generateApiSecret, formatDateTime } from "@/lib/format";

export default function UniApi() {
  const { profile } = useAuth();
  const [u, setU] = useState<any>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    if (!profile?.university_id) return;
    const { data } = await supabase.from("universities").select("*").eq("id", profile.university_id).maybeSingle();
    setU(data);
    const { data: l } = await supabase.from("api_logs").select("*").eq("university_id", profile.university_id).order("created_at", { ascending: false }).limit(20);
    setLogs(l ?? []);
  };
  useEffect(() => { load(); }, [profile?.university_id]);

  const regen = async () => {
    if (!u) return;
    const { error } = await supabase.from("universities").update({ api_key: generateApiKey(), api_secret: generateApiSecret() }).eq("id", u.id);
    if (error) toast.error(error.message); else { toast.success("API credentials regenerated"); load(); }
  };
  const copy = (v: string, label: string) => { navigator.clipboard.writeText(v); toast.success(`${label} copied`); };

  if (!u) return <AppLayout title="API Integration"><div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout title="API Integration" breadcrumbs={[{ label: "University" }, { label: "API Integration" }]}>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">Credentials <span className="flex items-center gap-1.5 text-xs font-normal text-success"><Activity className="h-3.5 w-3.5" /> API Online</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">API Key</label>
              <div className="flex gap-2 mt-1"><Input value={u.api_key} readOnly className="font-mono text-xs" /><Button variant="outline" size="icon" onClick={() => copy(u.api_key, "API key")}><Copy className="h-4 w-4" /></Button></div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">API Secret</label>
              <div className="flex gap-2 mt-1"><Input value={showSecret ? u.api_secret : "•".repeat(32)} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                <Button variant="outline" size="icon" onClick={() => copy(u.api_secret, "API secret")}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <Button variant="outline" onClick={regen}><RefreshCw className="h-4 w-4 mr-1.5" /> Regenerate credentials</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documentation</CardTitle></CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Sync certificates</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>POST /api/university/certificates/sync
X-Api-Key: {u.api_key}
X-Signature: HMAC_SHA256(body, api_secret)

{`{
  "certificates": [
    { "certificate_number": "UTM-2024-CS-00001", "student_name": "Ali bin Abu",
      "programme_name": "BSc Computer Science", "award_type": "First Class",
      "graduation_date": "2024-10-21" }
  ]
}`}</code></pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Verify a certificate</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>GET /api/certificates/verify/:certificateNumber

{`{ "status": "valid", "student_name": "Ali bin Abu",
  "programme_name": "BSc Computer Science",
  "graduation_date": "2024-10-21" }`}</code></pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Webhook: certificate status changes</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>POST /api/university/webhook/certificate-status</code></pre>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs">
              <strong>HMAC SHA-256:</strong> All requests must include <code>X-Signature</code>, computed as <code>HMAC_SHA256(rawBody, api_secret)</code>. Reject requests where the signature does not match.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>API logs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Endpoint</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>IP</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.endpoint}</TableCell>
                    <TableCell className="text-xs">{l.method}</TableCell>
                    <TableCell><span className={`text-xs font-medium ${l.response_status >= 400 ? "text-destructive" : "text-success"}`}>{l.response_status}</span></TableCell>
                    <TableCell className="font-mono text-xs">{l.ip_address}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
