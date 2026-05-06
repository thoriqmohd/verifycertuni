import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { maskName, formatDate } from "@/lib/format";

export default function PublicVerify() {
  const { certificateNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any>(null);
  const [uni, setUni] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("certificates").select("*").eq("certificate_number", certificateNumber).maybeSingle();
      if (c) {
        setCert(c);
        const { data: u } = await supabase.from("universities").select("name").eq("id", c.university_id).maybeSingle();
        setUni(u);
      }
      setLoading(false);
    })();
  }, [certificateNumber]);

  const status = cert?.certificate_status;
  const Icon = status === "valid" ? ShieldCheck : status === "revoked" ? ShieldX : ShieldAlert;
  const tone = status === "valid" ? "text-success" : status === "revoked" ? "text-destructive" : "text-warning";
  const bgTone = status === "valid" ? "bg-success/10" : status === "revoked" ? "bg-destructive/10" : "bg-warning/10";

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div><span className="font-bold">VerifyCert</span></Link>
          <span className="text-xs text-muted-foreground">Public Verification</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !cert ? (
            <Card><CardContent className="text-center py-12">
              <ShieldX className="h-12 w-12 mx-auto text-destructive mb-3" />
              <h2 className="text-xl font-bold mb-1">Certificate not found</h2>
              <p className="text-muted-foreground mb-5">No certificate matches this reference number.</p>
              <Button asChild><Link to="/">Back to website</Link></Button>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className={`p-6 ${bgTone} border-b flex items-center gap-4`}>
                  <Icon className={`h-12 w-12 ${tone}`} />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Certificate verification</div>
                    <div className="text-2xl font-bold capitalize">{status}</div>
                  </div>
                  <div className="ml-auto"><StatusBadge status={status} /></div>
                </div>
                <div className="p-6 grid sm:grid-cols-2 gap-5 text-sm">
                  <Field label="University" value={uni?.name} />
                  <Field label="Certificate Number" value={cert.certificate_number} />
                  <Field label="Student Name" value={maskName(cert.student_name)} />
                  <Field label="Programme" value={cert.programme_name} />
                  <Field label="Award" value={cert.award_type} />
                  <Field label="Graduation" value={formatDate(cert.graduation_date)} />
                </div>
                {(status === "revoked" || status === "suspended") && (
                  <div className="mx-6 mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
                    ⚠ This certificate is currently <strong className="capitalize">{status}</strong>. Please contact the issuing university for clarification.
                  </div>
                )}
                <div className="px-6 pb-6">
                  <div className="rounded-lg bg-muted p-4 text-sm flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Need a full official report with audit reference?</span>
                    <Button size="sm" asChild><Link to="/login">Login as Employer <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    <div className="font-medium">{value ?? "—"}</div>
  </div>
);
